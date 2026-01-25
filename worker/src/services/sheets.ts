/**
 * Google Sheets service for participant data storage
 */

import type { Env } from '../index';

// Expected column headers in the spreadsheet
const EXPECTED_HEADERS = [
  'nome',
  'cognome',
  'email',
  'telefono',
  'contatto_emergenza',
  'telefono_emergenza',
  'percorso',
  'consenso_lista',
  'payment_status',
  'stripe_session_id',
  'registration_date',
];

export interface ParticipantRow {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  contatto_emergenza: string;
  telefono_emergenza: string;
  percorso: string;
  consenso_lista: string;
  payment_status: string;
  stripe_session_id: string;
  registration_date: string;
}

export interface PublicParticipant {
  nome: string;
  cognome: string;
  percorso: string;
}

// Get Google Sheets access token using service account
async function getAccessToken(env: Env): Promise<string> {
  const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);

  // Create JWT for service account authentication
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Encode JWT parts
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const encodedClaim = btoa(JSON.stringify(claim))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Sign the JWT
  const privateKey = serviceAccount.private_key;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json() as { access_token: string };
  return tokenData.access_token;
}

// Convert PEM to binary
function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Append a row to the spreadsheet with exponential backoff
export async function appendRow(
  env: Env,
  data: ParticipantRow,
  maxRetries = 3
): Promise<void> {
  const accessToken = await getAccessToken(env);
  const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;
  const range = 'Iscrizioni!A:K';

  const values = [
    [
      data.nome,
      data.cognome,
      data.email,
      data.telefono,
      data.contatto_emergenza,
      data.telefono_emergenza,
      data.percorso,
      data.consenso_lista,
      data.payment_status,
      data.stripe_session_id,
      data.registration_date,
    ],
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );

      if (response.ok) {
        return;
      }

      // Rate limit - retry with backoff
      if (response.status === 429) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      const errorData = await response.text();
      throw new Error(`Sheets API error: ${response.status} - ${errorData}`);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Failed to append row after retries');
}

// Update payment status in the spreadsheet
export async function updatePaymentStatus(
  env: Env,
  stripeSessionId: string,
  status: 'paid' | 'failed'
): Promise<void> {
  const accessToken = await getAccessToken(env);
  const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;

  // First, find the row with the stripe session ID
  const searchResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Iscrizioni!A:K`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to read spreadsheet');
  }

  const data = await searchResponse.json() as { values?: string[][] };
  const rows = data.values || [];

  // Find the row index (1-based for Sheets API)
  const rowIndex = rows.findIndex((row) => row[9] === stripeSessionId);

  if (rowIndex === -1) {
    throw new Error('Registration not found');
  }

  // Update the payment status (column I, 1-indexed)
  const range = `Iscrizioni!I${rowIndex + 1}`;

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[status]] }),
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Failed to update payment status');
  }
}

// Get public participants (consented and paid only)
export async function getPublicParticipants(
  env: Env
): Promise<{ participants: PublicParticipant[]; total: number }> {
  const accessToken = await getAccessToken(env);
  const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Iscrizioni!A:K`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to read participants');
  }

  const data = await response.json() as { values?: string[][] };
  const rows = data.values || [];

  // Skip header row
  const dataRows = rows.slice(1);

  // Total count (all paid participants)
  const paidRows = dataRows.filter((row) => row[8] === 'paid');
  const total = paidRows.length;

  // Public participants (consented and paid)
  const publicParticipants = paidRows
    .filter((row) => row[7] === 'SI')
    .map((row) => ({
      nome: row[0],
      cognome: row[1],
      percorso: row[6],
    }));

  return { participants: publicParticipants, total };
}
