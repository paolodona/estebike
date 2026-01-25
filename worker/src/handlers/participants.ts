/**
 * Participants list handler
 * GET /participants
 */

import type { Env } from '../index';
import { getPublicParticipants } from '../services/sheets';

function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export async function handleParticipants(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit
): Promise<Response> {
  try {
    const { participants, total } = await getPublicParticipants(env);

    // Get route statistics
    const stats = {
      lungo: participants.filter((p) => p.percorso === 'lungo').length,
      medio: participants.filter((p) => p.percorso === 'medio').length,
      corto: participants.filter((p) => p.percorso === 'corto').length,
    };

    return jsonResponse(
      {
        participants,
        total, // Total paid participants (including non-public)
        publicCount: participants.length,
        stats,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Participants fetch error:', error);
    return jsonResponse(
      { error: 'Impossibile caricare la lista partecipanti' },
      500,
      corsHeaders
    );
  }
}
