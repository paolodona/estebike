/**
 * Email service using Resend
 */

import type { Env } from '../index';
import type { RegistrationData } from '../../../shared/schemas';

const routeLabels: Record<string, string> = {
  lungo: 'Percorso Lungo (85 km)',
  medio: 'Percorso Medio (55 km)',
  corto: 'Percorso Corto (35 km)',
};

export async function sendAdminNotification(
  env: Env,
  data: RegistrationData,
  paymentStatus: string
): Promise<void> {
  const emailContent = `
Nuova iscrizione al Magna & Pedala 2026

Dati partecipante:
- Nome: ${data.nome} ${data.cognome}
- Email: ${data.email}
- Telefono: ${data.telefono}
- Percorso: ${routeLabels[data.percorso] || data.percorso}

Contatto emergenza:
- Nome: ${data.contattoEmergenza}
- Telefono: ${data.telefonoEmergenza}

Consenso lista pubblica: ${data.consensoLista ? 'Sì' : 'No'}
Stato pagamento: ${paymentStatus}

Data: ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
`.trim();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'EsteBike <noreply@estebike.it>',
      to: [env.ADMIN_EMAIL],
      subject: `[Magna & Pedala] Nuova iscrizione: ${data.nome} ${data.cognome}`,
      text: emailContent,
    }),
  });

  if (!response.ok) {
    console.error('Failed to send admin notification email');
    // Don't throw - email failure shouldn't block registration
  }
}
