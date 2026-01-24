# EsteBike Website Specifications

## Overview

New website for EsteBike cycling club featuring the annual "Magna & Pedala" sportive event. The site should be modern, stylish, easy to maintain, and cost-effective.

**Inspiration:** Jesolo Gravel style - clean, friendly, community-focused with warm colors.

---

## Site Structure

### Pages

| Page | Purpose |
|------|---------|
| **Homepage** | Hero section, event highlight, announcements, club intro, sponsors |
| **Chi Siamo (About)** | Club history, mission, team/board members |
| **Magna & Pedala** | Event landing page with full details |
| **Percorsi (Routes)** | Route options with maps and GPX downloads |
| **Iscrizioni (Registration)** | Event registration form with Stripe payment |
| **Partecipanti (Participants)** | Live list of registered participants |
| **Galleria (Gallery)** | Photo galleries and video embeds |
| **Tesseramento (Membership)** | Annual club membership registration |
| **Contatti (Contact)** | Contact information and WhatsApp |
| **Blog/News** | News archive, announcements, club updates |

### Language
- **Italian only** - single language implementation

---

## Technical Stack

### Framework & Hosting
- **Static Site Generator:** Astro
- **Hosting:** GitHub Pages (free)
- **Domain:** estebike.it (existing)
- **SSL:** Provided by GitHub Pages

### Backend (Serverless Functions)
Since GitHub Pages is static-only, form submissions require a lightweight backend:

- **Provider:** Cloudflare Workers (free tier: 100k requests/day) or Netlify Functions
- **Purpose:** Handle registration form submissions securely
- **Workflow:**
  1. User submits registration form on Astro site
  2. Form data sent to serverless function endpoint
  3. Function validates data and writes to Google Sheets (via API)
  4. Function sends admin notification email (via Resend/SendGrid free tier)
  5. Function returns success → user redirected to Stripe Checkout

**Why serverless?** API credentials (Google Sheets, email service) cannot be exposed in frontend code. The serverless function keeps secrets secure on the server side.

### Content Management
- **Primary:** Markdown files in Git repository
- **Updates:** Edit markdown, push to GitHub, automatic rebuild
- **Participant List:** Google Sheets as data source (read via public CSV export or API)

### Payments
- **Provider:** Stripe Checkout
- **Use Cases:**
  - Event registration (Magna & Pedala)
  - Annual club membership
- **Flow:** Serverless function creates Stripe Checkout session → redirect user

---

## Event Registration (Magna & Pedala)

### Registration Data Collected
| Field | Type | Required |
|-------|------|----------|
| Nome (First Name) | Text | Yes |
| Cognome (Last Name) | Text | Yes |
| Email | Email | Yes |
| Telefono (Phone) | Phone | Yes |
| Contatto Emergenza (Emergency Contact) | Text | Yes |
| Telefono Emergenza | Phone | Yes |
| Percorso (Route Choice) | Select | Yes |
| Consenso Lista Pubblica | Checkbox | Yes |

### GDPR / Privacy Compliance
**Italian data protection law requires explicit consent for public display of personal data.**

The registration form includes a mandatory checkbox:
> ☐ Acconsento alla pubblicazione del mio nome e percorso scelto nella lista pubblica dei partecipanti. (I consent to the publication of my name and chosen route on the public participant list.)

- Users who consent: Name and route displayed on public list
- Users who decline: NOT shown on public list, but still counted in statistics
- The serverless function writes a `is_public` boolean to Google Sheets
- The participant list page filters to show only `is_public = TRUE` entries

**Alternative approach (simpler):** Display only aggregate statistics without names:
> "127 ciclisti iscritti! (45 Percorso Lungo, 52 Percorso Medio, 30 Percorso Corto)"

### Pricing
- **Single price** for all participants (amount TBD)
- Same price regardless of route choice

### Registration Flow (Technical)
1. User fills out form on `/iscrizioni` page
2. Client-side validation (required fields, email format, etc.)
3. Form submitted to serverless function endpoint
4. Serverless function:
   - Validates data server-side
   - Appends row to Google Sheets (including `is_public` consent flag)
   - Sends admin notification email via Resend/SendGrid
   - Creates Stripe Checkout session with participant metadata
   - Returns Stripe Checkout URL
5. User redirected to Stripe Checkout
6. After payment: Stripe webhook (optional) or manual verification

### Notifications
- **Admin notification:** Email sent by serverless function on each registration
- **Stripe dashboard:** Backup notification via Stripe

### Participant List
- **Public display:** Searchable list of registered participants **who consented**
- **Data source:** Google Sheets (public CSV export or API read)
- **Displayed fields:** Name, route choice, registration date
- **Privacy:** Only shows entries where `is_public = TRUE`
- **Statistics:** Total count includes ALL participants regardless of consent

---

## Routes

### Display
- Multiple route options (distances TBD)
- **Map integration:** Strava route embeds
- Elevation profiles visible in embed
- **GPX downloads:** Downloadable GPX file per route

### Route Information Per Route
- Distance (km)
- Elevation gain (m)
- Difficulty level
- Key waypoints/highlights
- Strava route embed
- GPX download button

---

## Media Features

### Photo Galleries
- Grid layout with lightbox
- Organized by event/year
- Lazy loading for performance

### Video Integration
- YouTube video embeds
- Embedded on homepage and gallery

### Social Integration
- **Instagram feed:** Embedded feed showing recent posts
- **Strava club feed:** Display recent club activities

---

## Club Membership

### Registration
- Separate Stripe Checkout flow via serverless function
- Same architecture as event registration
- Annual membership fee (amount TBD)

### Membership Registration Flow
1. User fills form on `/tesseramento` page
2. Form submitted to serverless function
3. Function writes to separate "Membri" Google Sheet
4. Function sends admin notification
5. Function creates Stripe Checkout session
6. User completes payment

### Data Collected
- Name, email, phone
- Address (for membership card)
- Codice Fiscale (Italian tax code, if required for insurance)

---

## Blog / News

### Purpose
- Club announcements and updates
- Event recaps and reports
- Community news
- Migration of historical posts from the old website (2013-2018)

### Content Structure
Each blog post is a markdown file with frontmatter:

```yaml
---
title: "Post Title"
date: 2026-01-15
author: "admin"
category: "Comunicato del direttivo"
tags: ["tesseramento", "divise"]
image: "/images/blog/post-image.jpg"  # optional
excerpt: "Brief summary for listings"  # optional, auto-generated if missing
---

Post content in markdown...
```

### Categories (from legacy site)
- Comunicato del direttivo
- News
- Coppa Colli Euganei
- Convenzioni

### Display
- **Homepage:** Latest 3-5 posts as cards with date, title, excerpt
- **Blog archive page:** Paginated list of all posts (10 per page)
- **Individual post page:** Full content with metadata, previous/next navigation

### Authoring Workflow
- Create new `.md` file in `/src/content/blog/`
- Filename format: `YYYY-MM-DD-slug.md` (e.g., `2026-01-15-tesseramento-2026.md`)
- Push to GitHub → automatic rebuild and deploy
- Quick posts: minimal frontmatter (just title and date) for fast announcements

---

## Sponsors Section

### Display
- **Prominent placement** on homepage
- Sponsor tiers (e.g., Gold, Silver, Bronze) if applicable
- Logo grid with links
- Dedicated section, not just footer

### Management
- Logos stored in `/public/sponsors/`
- Configured via markdown/frontmatter

---

## Contact Options

### Channels
- **WhatsApp button:** Click-to-chat with club number
- **Email address:** Displayed email for inquiries
- **Social links:** Instagram, Facebook, Strava

### No contact form required

---

## Homepage Components

1. **Hero Section**
   - Large background image/video
   - Event name and date
   - CTA button to registration

2. **Blog/News Section**
   - Full blog entries with title, date, content, and optional image
   - Displays latest posts (3-5 items) on homepage
   - Link to dedicated blog archive page
   - Managed via markdown files in `/src/content/blog/`

3. **Event Highlight**
   - Magna & Pedala preview
   - Key stats (routes, participants)
   - Link to full event page

4. **Club Introduction**
   - Brief about section
   - Link to full Chi Siamo page

5. **Media Preview**
   - Recent photos/video thumbnail
   - Link to gallery

6. **Strava Club Feed**
   - Recent club activities widget

7. **Sponsors**
   - Logo grid with links

8. **Instagram Feed**
   - Embedded recent posts

---

## Non-Functional Requirements

### Performance
- Lighthouse score > 90
- Image optimization (WebP, lazy loading)
- Minimal JavaScript

### SEO
- Semantic HTML
- Meta tags per page
- Open Graph tags for social sharing
- Sitemap.xml

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Alt text on images

### Mobile-First (PRIMARY REQUIREMENT)
**The site MUST be designed mobile-first.** Mobile is the primary design target, not an afterthought.

- **Design for mobile screens first**, then progressively enhance for larger screens
- All layouts, components, and interactions must work perfectly on mobile before considering desktop
- Touch-friendly navigation with appropriately sized tap targets (minimum 44x44px)
- Fast load on 3G connections
- No horizontal scrolling on any screen size
- Forms optimized for mobile input (appropriate keyboard types, large fields)
- Images must be responsive and not cause layout shifts

---

## Integrations Summary

| Service | Purpose | Cost |
|---------|---------|------|
| GitHub Pages | Static site hosting | Free |
| Cloudflare Workers | Serverless functions (form handling) | Free (100k req/day) |
| Stripe | Payments | ~1.4% + €0.25 per transaction |
| Google Sheets | Participant data storage | Free |
| Resend / SendGrid | Admin email notifications | Free tier (100/day) |
| YouTube | Video hosting | Free |
| Instagram | Feed embed | Free |
| Strava | Route embeds, club feed | Free |
| WhatsApp | Contact button | Free |

**Estimated monthly cost: €0** (only per-transaction Stripe fees)

### Architecture Diagram
```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Astro Site    │────▶│  Cloudflare Worker   │────▶│  Google Sheets  │
│  (GitHub Pages) │     │  (serverless func)   │     │  (participant   │
│                 │     │                      │     │   data store)   │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────────┐
        │               │   Resend/SendGrid    │
        │               │  (admin email alert) │
        │               └──────────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────────┐
        └──────────────▶│   Stripe Checkout    │
                        │  (payment redirect)  │
                        └──────────────────────┘
```

---

## Future Considerations

- Multi-language support (English) if event grows
- Member login portal
- Automated email confirmations to participants
- Online results/timing integration
