/**
 * Stripe service for payment processing
 */

import Stripe from 'stripe';
import type { Env } from '../index';
import type { RegistrationData } from '../../../shared/schemas';

export async function createCheckoutSession(
  env: Env,
  data: RegistrationData,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Magna & Pedala 2026',
            description: `Iscrizione ${data.percorso === 'lungo' ? 'Percorso Lungo' : data.percorso === 'medio' ? 'Percorso Medio' : 'Percorso Corto'}`,
          },
          unit_amount: 2500, // €25.00 in cents - TODO: make configurable
        },
        quantity: 1,
      },
    ],
    customer_email: data.email,
    metadata: {
      nome: data.nome,
      cognome: data.cognome,
      percorso: data.percorso,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function verifyWebhookSignature(
  env: Env,
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}
