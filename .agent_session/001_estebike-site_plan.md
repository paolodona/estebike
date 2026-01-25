# Implementation Plan: EsteBike Website
Plan: 001 | Name: estebike-site | Created: 2026-01-25 | Status: IMPLEMENTED | GitRef: 63d147f

## Related Files
- **Prompt**: `.agent_session/001_estebike-site_prompt.md` - Original mission
- **Context**: `.agent_session/001_estebike-site_context.md` - Research findings

---

## Overview

Build a complete website for EsteBike cycling club featuring the annual "Magna & Pedala" sportive event. The site uses Astro 5.x hosted on GitHub Pages, with Cloudflare Workers for backend API functions (registration, payments, data storage).

**Key Technical Decisions:**
- **Astro 5.x** (stable) with Content Collections for blog
- **GitHub Pages** (free static hosting) + **Cloudflare Workers** (free serverless API)
- **Stripe Checkout** for payments (event registration, membership)
- **Google Sheets** as participant database (Service Account API for writes, public CSV for reads)
- **Mobile-first CSS** using CSS custom properties

## Affected Areas

| Area | Affected | Scope |
|------|----------|-------|
| Frontend (Astro) | Yes | 10 pages, design system, components |
| Backend (CF Workers) | Yes | 3 API endpoints (register, webhook, participants) |
| Content | Yes | Blog migration, gallery images |
| Integrations | Yes | Stripe, Google Sheets, Strava, Instagram |

## What We're NOT Doing

- Multi-language support (Italian only)
- Member login portal
- Dark mode
- Automated payment webhooks (manual verification acceptable for MVP)
- Instagram API integration (use embed fallback)

---

## Phase 1: Core Foundation & Pages
**Goal**: Initialize Astro project, implement design system, build UI components, create static pages, set up blog

### 1.1 Project Initialization

**Files to create:**
```
/package.json
/astro.config.mjs
/tsconfig.json
/.gitignore
/.prettierrc
```

**Key dependencies:**
- `astro@^5.0.0`
- `@astrojs/sitemap`
- `@fontsource/montserrat`
- `@fontsource/open-sans`
- `lucide-astro`
- `astro-seo`

### 1.2 Design System (CSS Variables)

**File: `/src/styles/variables.css`**

Core CSS custom properties:
```css
/* Primary - Este Red */
--color-primary: #C41E3A;
--color-primary-light: #E63950;
--color-primary-dark: #9A1830;

/* Accent - Este Gold */
--color-accent: #F7D000;
--color-accent-light: #FFE44D;
--color-accent-dark: #D4B000;

/* Neutrals */
--color-charcoal: #2D2D2D;
--color-off-white: #FAFAFA;

/* Typography */
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Open Sans', sans-serif;

/* Spacing scale: 4px increments */
/* Type scale: xs(12px) to 6xl(60px) */
/* Breakpoints: sm(640) md(768) lg(1024) xl(1280) */
```

**File: `/src/styles/global.css`**
- CSS reset, base typography
- Mobile-first defaults (min-width media queries only)
- Focus states, skip-to-content link
- Container utility class

### 1.3 UI Components

**Files to create:**
```
/src/components/ui/Button.astro      # 4 variants: primary, secondary, accent, ghost
/src/components/ui/Card.astro        # Event, Blog, Sponsor variants
/src/components/ui/Input.astro       # Form inputs with labels, validation states
/src/components/ui/Badge.astro       # Category/route badges
/src/components/ui/Icon.astro        # Lucide icon wrapper
```

**Button requirements:**
- Minimum 44x44px touch target
- All 4 variants from DESIGN.md
- Supports `href` (renders as `<a>`) or `type="submit"` (renders as `<button>`)

### 1.4 Layout Components

**Files to create:**
```
/src/components/layout/Header.astro     # Red navbar, mobile hamburger
/src/components/layout/Footer.astro     # Dark red, social links
/src/components/layout/Hero.astro       # Full-height with red gradient overlay
/src/components/layout/MobileNav.astro  # Full-screen mobile menu overlay
```

**File: `/src/layouts/BaseLayout.astro`**
- SEO meta tags (title, description, canonical, Open Graph)
- Preconnects to Google Fonts, external services
- Skip-to-content accessibility link
- Header + main#main-content + Footer structure

### 1.5 Blog Content Collection

**File: `/src/content/config.ts`**
```typescript
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string().default('admin'),
    category: z.enum(['Comunicato del direttivo', 'News', 'Coppa Colli Euganei', 'Convenzioni']),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    excerpt: z.string().optional(),
    draft: z.boolean().default(false)
  })
});
```

**Blog pages:**
```
/src/pages/blog/index.astro      # Archive with pagination (10/page)
/src/pages/blog/[...slug].astro  # Individual post pages
```

### 1.6 Static Pages

**Files to create:**
```
/src/pages/index.astro                    # Homepage
/src/pages/chi-siamo.astro                # About (club history, team)
/src/pages/magna-e-pedala/index.astro     # Event landing page
/src/pages/contatti.astro                 # Contact info, WhatsApp
```

### 1.7 Assets

**Files to place/create:**
```
/public/favicon.png
/public/images/estebike-logo.svg          # Create SVG from PNG
/public/images/estebike-logo-white.svg    # White version for red backgrounds
/public/images/estebike-icon.svg          # Icon for favicon
/public/images/og-default.jpg             # Open Graph fallback
```

**Note:** SVG logo versions require manual recreation by a designer for best quality. Automated PNG→SVG tracing produces poor results. If no designer is available, use optimized PNG versions with appropriate compression.

### 1.8 Local Development Setup

**File: `/CONTRIBUTING.md`** (or section in README)

Document the development workflow:
```bash
# Install dependencies
npm install

# Start Astro dev server
npm run dev

# In separate terminal, start Worker dev (Phase 2+)
cd worker && npx wrangler dev

# Test Stripe webhooks locally (Phase 2+)
stripe listen --forward-to localhost:8787/webhook/stripe
```

**Required local environment variables** (`.env.local`):
- `PUBLIC_API_URL` - Worker URL (localhost:8787 for dev)
- Worker secrets managed via `wrangler secret`

### Success Criteria - Phase 1

**Automated:**
```bash
npm run build                     # Builds without errors
npx tsc --noEmit                  # Type checking passes
npx lighthouse http://localhost:4321 --only-categories=performance,accessibility,seo
```

**Manual:**
- [ ] All pages render on mobile (320px width) without horizontal scroll
- [ ] Navigation hamburger menu works on mobile
- [ ] Colors match design system
- [ ] Touch targets ≥ 44x44px
- [ ] Blog pagination works
- [ ] Fonts load (Montserrat, Open Sans)

---

## Phase 2: Routes, Registration & Backend
**Goal**: Implement event routes with Strava embeds, build registration form, deploy Cloudflare Worker

### 2.1 Cloudflare Worker API

**Location: `/worker/` directory in main repository (monorepo)**

> **Note:** Using a monorepo allows sharing validation schemas (Zod) between the Astro frontend and Worker backend, simplifies CI/CD, and prevents schema drift between form fields and API validation.

**File: `/worker/src/index.ts`**

Endpoints:
```
POST /register     → Validate → Write Google Sheets → Send email → Create Stripe session → Return checkout URL
POST /webhook/stripe → Verify signature → Update payment status in Sheets
GET  /participants → Read Sheets → Filter is_public=true → Return JSON
GET  /health       → Return { status: 'ok' }
```

**Environment variables (Cloudflare secrets):**
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `GOOGLE_SPREADSHEET_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ADMIN_EMAIL`

**CORS:** Allow only `https://estebike.it` and `https://www.estebike.it`

**Google Sheets Integration Requirements:**
- Use `sheets.spreadsheets.values.append` method (atomic, safe for concurrent writes)
- Implement exponential backoff (3 retries) for 429 rate limit errors
- Store sheet name and column headers as constants to detect structural changes
- Log warnings if header row doesn't match expected schema

### 2.2 Registration Form

**File: `/src/components/forms/RegistrationForm.astro`**

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Nome | text | Yes | Min 1 char |
| Cognome | text | Yes | Min 1 char |
| Email | email | Yes | Valid email |
| Telefono | tel | Yes | Valid phone |
| Contatto Emergenza | text | Yes | Min 1 char |
| Telefono Emergenza | tel | Yes | Valid phone |
| Percorso | radio | Yes | lungo/medio/corto |
| Consenso Lista | checkbox | No | GDPR consent for public display |
| Consenso Privacy | checkbox | Yes | Must accept |

**Client-side validation** with Italian error messages, then submit to Worker API.

### 2.3 Routes Page

**File: `/src/pages/magna-e-pedala/percorsi.astro`**

For each route (Lungo, Medio, Corto):
- Strava route embed (`iframe src="https://www.strava.com/routes/ROUTE_ID/embed"`)
- Distance, elevation, difficulty
- Key waypoints/highlights
- GPX download button

**Files to place:**
```
/public/gpx/percorso-lungo.gpx
/public/gpx/percorso-medio.gpx
/public/gpx/percorso-corto.gpx
```

### 2.4 Participants Page

**File: `/src/pages/magna-e-pedala/partecipanti.astro`**

- Stats banner (total count, counts by route)
- Search/filter input
- Table of participants (name, route) - only `is_public=true`
- Privacy note explaining consent filtering
- Client-side fetch from Worker API with error handling

### 2.5 Registration Flow Page

**File: `/src/pages/magna-e-pedala/iscrizioni.astro`**

- Event info summary
- Registration form component
- Price display
- GDPR/privacy links

### Success Criteria - Phase 2

**Automated:**
```bash
# Worker tests
cd worker && npm test

# Deploy worker
wrangler publish

# API health check
curl -X GET https://api.estebike.it/health
```

**Manual:**
- [ ] Registration form validates all required fields
- [ ] Form shows Italian error messages
- [ ] Stripe Checkout redirects correctly
- [ ] Payment updates Google Sheet
- [ ] Participant list shows only consented entries
- [ ] Strava embeds load with elevation profiles
- [ ] GPX downloads work

---

## Phase 3: Media & Social Integration
**Goal**: Gallery with lightbox, Instagram/Strava feeds, YouTube embeds

### 3.1 Gallery Page

**File: `/src/pages/galleria.astro`**

- Grid layout (1 col mobile, 2 tablet, 3 desktop)
- Lightbox modal with keyboard navigation (arrows, escape)
- Lazy loading for images
- Organized by event/year

### 3.2 Social Components

**Files to create:**
```
/src/components/sections/InstagramFeed.astro   # Fallback to profile link
/src/components/sections/StravaClubFeed.astro  # Club activities widget
/src/components/ui/YouTubeEmbed.astro          # lite-youtube-embed for performance
```

**Instagram:** Use embed fallback (API requires Business account approval). Display "Follow us" CTA with profile link.

**Strava:** Use club latest-rides embed: `https://www.strava.com/clubs/Team-Estebike-Zordan/latest-rides/`

**YouTube:** Use `lite-youtube-embed` package for performance (no autoload).

### Success Criteria - Phase 3

**Manual:**
- [ ] Gallery lightbox opens, navigates, closes
- [ ] Keyboard navigation works (arrows, escape)
- [ ] Images lazy load
- [ ] Instagram section displays or degrades gracefully
- [ ] Strava widget loads
- [ ] YouTube videos don't autoload (lite-youtube)

---

## Phase 4: Membership, Sponsors & Polish
**Goal**: Tesseramento page, sponsors section, Lighthouse 90+, accessibility audit

### 4.1 Membership Page

**File: `/src/pages/tesseramento.astro`**

Similar to registration but with:
- Address fields (for membership card)
- Codice Fiscale (Italian tax ID)
- Separate Stripe product

### 4.2 Sponsors Section

**File: `/src/components/sections/Sponsors.astro`**

- Tiered display (Gold/Silver/Bronze)
- Logo grid with grayscale→color hover effect
- Links to sponsor websites

**Migrate logos from:** `crawled-site/www.estebike.it/wp-content/uploads/*/2014sponsor_*.png`

### 4.3 WhatsApp Button

**File: `/src/components/ui/WhatsAppButton.astro`**

- Fixed position bottom-right
- Pre-filled message
- Opens WhatsApp chat

### 4.4 Performance Optimization

**Add to astro.config.mjs:**
- `astro-compress` integration
- CSS minification
- Inline stylesheets (auto)

**Image optimization:**
- WebP conversion (built-in `astro:assets`)
- Responsive `srcset`
- Lazy loading for below-fold

### 4.5 Accessibility Audit

- ARIA labels on interactive elements
- `aria-expanded` on mobile menu toggle
- Focus management in modals
- Skip-to-content link
- Color contrast verification

### 4.6 GitHub Pages Deployment

**File: `/.github/workflows/deploy.yml`**

Uses `withastro/action@v5` and `actions/deploy-pages@v4`

### Success Criteria - Phase 4

**Automated:**
```bash
# Lighthouse CI on all pages
npx @lhci/cli autorun

# Accessibility
npx pa11y-ci --sitemap http://localhost:4321/sitemap.xml
```

**Manual:**
- [ ] Lighthouse Performance ≥ 90 all pages
- [ ] Lighthouse Accessibility ≥ 90 all pages
- [ ] Keyboard-only navigation works
- [ ] Screen reader testing
- [ ] Membership form + payment works
- [ ] Sponsors display correctly
- [ ] Site deploys to GitHub Pages
- [ ] estebike.it DNS configured

---

## Edge Cases & Risk Mitigation

### API Failures

**Stripe/Sheets failure:**
- Show user-friendly error with fallback contact (email, WhatsApp)
- Cloudflare Worker: 3 retries with exponential backoff
- Admin alert email on persistent failures

**Participant list failure:**
- Show "Impossibile caricare" with retry button
- Graceful degradation, don't break page

### GDPR Compliance

**Participant List:**
- Only display rows where `consenso_lista = 'SI'` AND `payment_status = 'paid'`
- Never expose email, phone, or emergency contact publicly
- Total count includes ALL participants (regardless of consent)

**Google Sheets columns:**
| Column | Field | Public |
|--------|-------|--------|
| A | Nome | If consented |
| B | Cognome | If consented |
| C | Email | Admin only |
| D | Telefono | Admin only |
| E | Emergency Contact | Admin only |
| F | Emergency Phone | Admin only |
| G | Percorso | If consented |
| H | Consenso Lista | Filter flag |
| I | Payment Status | Admin only |
| J | Registration Date | Admin only |

### Instagram API Changes

Instagram's embed API is unstable. Mitigation:
1. Use third-party service (Behold.so) if budget allows
2. Fall back to static "Follow us" CTA with profile link
3. Don't rely on automatic feed display

---

## File Structure Summary

```
estebike/
├── .github/workflows/deploy.yml
├── public/
│   ├── images/ (logos, heroes, gallery)
│   ├── sponsors/
│   └── gpx/
├── src/
│   ├── components/
│   │   ├── ui/ (Button, Card, Input, Badge, Icon, YouTubeEmbed, WhatsAppButton)
│   │   ├── layout/ (Header, Footer, Hero, MobileNav)
│   │   ├── sections/ (Sponsors, InstagramFeed, StravaClubFeed, LatestNews)
│   │   └── forms/ (RegistrationForm, MembershipForm)
│   ├── layouts/ (BaseLayout, EventLayout, BlogLayout)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── chi-siamo.astro
│   │   ├── contatti.astro
│   │   ├── galleria.astro
│   │   ├── tesseramento.astro
│   │   ├── privacy.astro
│   │   ├── magna-e-pedala/ (index, percorsi, iscrizioni, partecipanti)
│   │   └── blog/ (index, [...page], [slug])
│   ├── content/
│   │   ├── config.ts
│   │   └── blog/*.md
│   └── styles/ (variables.css, global.css)
├── worker/ (Cloudflare Worker - separate repo optional)
│   └── src/ (index.ts, sheets.ts, stripe.ts, email.ts)
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Critical Files

| File | Purpose | Phase |
|------|---------|-------|
| `/src/styles/variables.css` | Design system foundation | 1 |
| `/src/layouts/BaseLayout.astro` | SEO, structure, accessibility | 1 |
| `/src/content/config.ts` | Blog schema validation | 1 |
| `/worker/src/index.ts` | Backend API | 2 |
| `/src/components/forms/RegistrationForm.astro` | Event registration | 2 |

---

## Verification Plan

### End-to-End Testing

1. **Homepage**: Loads, hero displays, news section shows posts, sponsors render
2. **Registration flow**: Fill form → Stripe → Payment → Participant appears in list
3. **Blog**: Archive paginates, posts render markdown, images display
4. **Routes**: Strava embeds load, GPX downloads work
5. **Mobile**: All pages work at 320px width, no horizontal scroll, touch targets work

### Performance Benchmarks

| Page | Target Lighthouse Score |
|------|------------------------|
| Homepage | Performance ≥ 90, Accessibility ≥ 90 |
| Blog Archive | Performance ≥ 90 |
| Registration | Performance ≥ 85 (form JS) |
| Gallery | Performance ≥ 85 (images) |

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production
npm run preview

# Lighthouse
npx lighthouse http://localhost:4321 --view

# Accessibility
npx pa11y http://localhost:4321

# Deploy (automatic via GitHub Actions on push to main)
git push origin main
```
