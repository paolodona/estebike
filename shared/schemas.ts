import { z } from 'zod';

/**
 * Shared validation schemas for EsteBike forms
 * Used by both Astro frontend and Cloudflare Worker
 */

// Route options for Magna & Pedala
export const routeOptions = ['lungo', 'medio', 'corto'] as const;
export type RouteOption = (typeof routeOptions)[number];

// Italian phone number regex (accepts various formats)
const phoneRegex = /^(\+39)?[\s]?3\d{2}[\s]?\d{3}[\s]?\d{4}$/;

// Registration form schema
export const registrationSchema = z.object({
  nome: z
    .string()
    .min(1, 'Il nome è obbligatorio')
    .max(50, 'Il nome non può superare 50 caratteri'),

  cognome: z
    .string()
    .min(1, 'Il cognome è obbligatorio')
    .max(50, 'Il cognome non può superare 50 caratteri'),

  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un'email valida"),

  telefono: z
    .string()
    .min(1, 'Il telefono è obbligatorio')
    .regex(phoneRegex, 'Inserisci un numero di telefono valido'),

  contattoEmergenza: z
    .string()
    .min(1, 'Il contatto di emergenza è obbligatorio')
    .max(100, 'Il nome non può superare 100 caratteri'),

  telefonoEmergenza: z
    .string()
    .min(1, 'Il telefono di emergenza è obbligatorio')
    .regex(phoneRegex, 'Inserisci un numero di telefono valido'),

  percorso: z.enum(routeOptions, {
    errorMap: () => ({ message: 'Seleziona un percorso' }),
  }),

  consensoLista: z.boolean().default(false),

  consensoPrivacy: z.boolean().refine((val) => val === true, {
    message: "Devi accettare l'informativa sulla privacy",
  }),
});

export type RegistrationData = z.infer<typeof registrationSchema>;

// Membership form schema (extends registration)
export const membershipSchema = z.object({
  nome: z
    .string()
    .min(1, 'Il nome è obbligatorio')
    .max(50, 'Il nome non può superare 50 caratteri'),

  cognome: z
    .string()
    .min(1, 'Il cognome è obbligatorio')
    .max(50, 'Il cognome non può superare 50 caratteri'),

  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un'email valida"),

  telefono: z
    .string()
    .min(1, 'Il telefono è obbligatorio')
    .regex(phoneRegex, 'Inserisci un numero di telefono valido'),

  indirizzo: z
    .string()
    .min(1, "L'indirizzo è obbligatorio")
    .max(200, "L'indirizzo non può superare 200 caratteri"),

  cap: z
    .string()
    .min(5, 'Inserisci un CAP valido')
    .max(5, 'Inserisci un CAP valido')
    .regex(/^\d{5}$/, 'Il CAP deve essere di 5 cifre'),

  citta: z
    .string()
    .min(1, 'La città è obbligatoria')
    .max(100, 'La città non può superare 100 caratteri'),

  codiceFiscale: z
    .string()
    .min(16, 'Il codice fiscale deve essere di 16 caratteri')
    .max(16, 'Il codice fiscale deve essere di 16 caratteri')
    .regex(
      /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i,
      'Inserisci un codice fiscale valido'
    ),

  consensoPrivacy: z.boolean().refine((val) => val === true, {
    message: "Devi accettare l'informativa sulla privacy",
  }),
});

export type MembershipData = z.infer<typeof membershipSchema>;

// Route display names
export const routeLabels: Record<RouteOption, string> = {
  lungo: 'Percorso Lungo (85 km)',
  medio: 'Percorso Medio (55 km)',
  corto: 'Percorso Corto (35 km)',
};

// Italian error messages for common validation errors
export const italianErrors = {
  required: 'Questo campo è obbligatorio',
  email: "Inserisci un'email valida",
  phone: 'Inserisci un numero di telefono valido',
  minLength: (min: number) => `Minimo ${min} caratteri`,
  maxLength: (max: number) => `Massimo ${max} caratteri`,
};
