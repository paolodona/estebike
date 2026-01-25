/**
 * Stripe webhook handler
 * POST /webhook/stripe
 */

import type Stripe from 'stripe';
import type { Env } from '../index';
import { verifyWebhookSignature } from '../services/stripe';
import { updatePaymentStatus } from '../services/sheets';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleStripeWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Get the signature header
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return jsonResponse({ error: 'Missing signature' }, 400);
    }

    // Get the raw body
    const payload = await request.text();

    // Verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await verifyWebhookSignature(env, payload, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return jsonResponse({ error: 'Invalid signature' }, 400);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === 'paid') {
          // Update payment status in Google Sheets
          await updatePaymentStatus(env, session.id, 'paid');
          console.log(`Payment completed for session ${session.id}`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Mark as failed/expired in Google Sheets
        await updatePaymentStatus(env, session.id, 'failed');
        console.log(`Payment expired for session ${session.id}`);
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResponse({ error: 'Webhook processing failed' }, 500);
  }
}
