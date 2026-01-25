/**
 * EsteBike API Worker
 * Handles registration, payments, and participant data
 */

import { handleRegister } from './handlers/register';
import { handleParticipants } from './handlers/participants';
import { handleStripeWebhook } from './handlers/webhook';

export interface Env {
  GOOGLE_SERVICE_ACCOUNT_KEY: string;
  GOOGLE_SPREADSHEET_ID: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  ALLOWED_ORIGINS: string;
}

// CORS headers for allowed origins
function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

  // Allow localhost in development
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }

  return {};
}

// JSON response helper
function jsonResponse(
  data: unknown,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Error response helper
function errorResponse(
  message: string,
  status = 400,
  headers: HeadersInit = {}
): Response {
  return jsonResponse({ error: message }, status, headers);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Get CORS headers
    const corsHeaders = getCorsHeaders(request, env);

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // Health check
      if (path === '/health' && method === 'GET') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, 200, corsHeaders);
      }

      // Registration endpoint
      if (path === '/register' && method === 'POST') {
        return handleRegister(request, env, corsHeaders);
      }

      // Participants list endpoint
      if (path === '/participants' && method === 'GET') {
        return handleParticipants(request, env, corsHeaders);
      }

      // Stripe webhook endpoint
      if (path === '/webhook/stripe' && method === 'POST') {
        return handleStripeWebhook(request, env);
      }

      // 404 for unknown routes
      return errorResponse('Not found', 404, corsHeaders);
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500, corsHeaders);
    }
  },
};
