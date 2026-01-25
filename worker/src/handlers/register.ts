/**
 * Registration handler
 * POST /register
 */

import { z } from 'zod';
import type { Env } from '../index';
import { registrationSchema, type RegistrationData } from '../../../shared/schemas';
import { appendRow, type ParticipantRow } from '../services/sheets';
import { createCheckoutSession } from '../services/stripe';
import { sendAdminNotification } from '../services/email';

interface RegisterRequest {
  data: RegistrationData;
  successUrl: string;
  cancelUrl: string;
}

function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export async function handleRegister(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit
): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as RegisterRequest;

    // Validate input
    const validationResult = registrationSchema.safeParse(body.data);

    if (!validationResult.success) {
      return jsonResponse(
        {
          error: 'Dati non validi',
          details: validationResult.error.flatten().fieldErrors,
        },
        400,
        corsHeaders
      );
    }

    const data = validationResult.data;

    // Validate URLs
    if (!body.successUrl || !body.cancelUrl) {
      return jsonResponse(
        { error: 'URL di ritorno mancanti' },
        400,
        corsHeaders
      );
    }

    // Create Stripe checkout session
    const { sessionId, url } = await createCheckoutSession(
      env,
      data,
      body.successUrl,
      body.cancelUrl
    );

    // Write to Google Sheets
    const row: ParticipantRow = {
      nome: data.nome,
      cognome: data.cognome,
      email: data.email,
      telefono: data.telefono,
      contatto_emergenza: data.contattoEmergenza,
      telefono_emergenza: data.telefonoEmergenza,
      percorso: data.percorso,
      consenso_lista: data.consensoLista ? 'SI' : 'NO',
      payment_status: 'pending',
      stripe_session_id: sessionId,
      registration_date: new Date().toISOString(),
    };

    await appendRow(env, row);

    // Send admin notification (non-blocking)
    sendAdminNotification(env, data, 'pending').catch((err) => {
      console.error('Email notification failed:', err);
    });

    // Return checkout URL
    return jsonResponse(
      {
        success: true,
        checkoutUrl: url,
        sessionId,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Check for specific error types
    if (error instanceof z.ZodError) {
      return jsonResponse(
        {
          error: 'Dati non validi',
          details: error.flatten().fieldErrors,
        },
        400,
        corsHeaders
      );
    }

    return jsonResponse(
      {
        error: 'Si è verificato un errore. Riprova più tardi o contattaci direttamente.',
      },
      500,
      corsHeaders
    );
  }
}
