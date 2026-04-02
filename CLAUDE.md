# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EsteBike is a website for a cycling club based in Este (Padova, Veneto, Italy). The site is built with **Astro 5** and deployed to **GitHub Pages**. The flagship event is **Magna & Pedala** (30th edition, May 10, 2026), with registration handled via Eventbrite.

**Stack:**

- Framework: Astro 5 (static site generator, `type: "module"`)
- Hosting: GitHub Pages (deployed via `.github/workflows/deploy.yml` on push to `main`)
- Language: TypeScript
- Styling: Vanilla CSS with CSS custom properties (no Tailwind)
- Fonts: Montserrat (headings) + Open Sans (body) via `@fontsource`
- Icons: `@lucide/astro`
- SEO: `astro-seo`, `@astrojs/sitemap`, structured data (JSON-LD)
- Formatting: Prettier with `prettier-plugin-astro`

## Build & Dev Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build
npm run lint       # Check formatting (prettier --check .)
npm run format     # Fix formatting (prettier --write .)
```

Node 20 is used in CI. Run `npm ci` to install dependencies.

## Key Documentation

Before implementing any feature, read:

- `docs/SPECS.md` - Technical specifications, site structure, registration flow, integrations
- `docs/DESIGN.md` - Complete design system with colors, typography, components, layouts

## Critical Design Constraints

### Mobile-First (Primary Requirement)

- **Design for mobile screens first**, then enhance for larger screens with `min-width` media queries
- Never write desktop-first CSS
- Minimum touch targets: 44px (`--touch-target-min`)
- No horizontal scrolling

### Brand Colors (Este Coat of Arms)

```css
--color-primary: #cc2635; /* Este Red */
--color-accent: #f7d000; /* Este Gold */
--color-charcoal: #2d2d2d; /* Primary text */
```

- Yellow text should NEVER appear on white backgrounds
- Yellow works as badges/buttons on red or dark backgrounds
- Full color system defined in `src/styles/variables.css`

### Typography

- Headings: Montserrat (`--font-heading`)
- Body: Open Sans (`--font-body`)

### Formatting Rules (Prettier)

- Semicolons: yes
- Single quotes
- 2-space indent
- Trailing commas: ES5

## Project Structure

```
/src
  /components/
    /ui/          # Button, Card, CardImage, CardBody, Badge, Input, Select,
                  # Checkbox, Radio, Textarea, Icon, WhatsAppButton, YouTubeEmbed
    /layout/      # Header, Footer, Hero, PageHeader
    /sections/    # Sponsors, InstagramFeed, StravaClubFeed
    /seo/         # JsonLd, EventSchema, OrganizationSchema, BlogPostingSchema,
                  #   BreadcrumbSchema, FaqSchema
  /layouts/       # BaseLayout.astro
  /pages/         # index, chi-siamo, magna-e-pedala, galleria, tesseramento,
                  #   contatti, privacy, blog/index, blog/[...slug], rss.xml
  /content/blog/  # Markdown blog posts (70+ migrated from old site)
  /styles/        # global.css, variables.css (full design token system)
  /plugins/       # rehype-base-url.mjs (rewrites markdown image URLs for base path)
  /utils/         # base.ts - url() helper for base path prefixing
/shared
  /schemas.ts     # Zod validation schemas shared between frontend and backend
/public
  /images/        # Blog images (organized by year/month), hero images, about-team.jpg
  /downloads/     # Downloadable files (e.g., event flyers)
  /favicon.png
/scripts
  /crawl-site.*   # Scripts to crawl the old estebike.it site
  /migrate-blog/  # Blog migration tool (old site HTML → Astro markdown)
  /whatsapp-gallery/  # WhatsApp media import pipeline for gallery page
/crawled-site/    # Mirror of old estebike.it (2013-2024 content, reference only)
/docs/            # SPECS.md, DESIGN.md, social-media-links.txt
/assets/          # estebike-logo.png
```

## Architecture Notes

### Base URL Handling

The site may be served from a subpath (e.g., `/estebike/`). Use `url()` from `src/utils/base.ts` to prefix paths in Astro components. Markdown image paths are automatically rewritten by the `rehype-base-url` plugin.

### Content Collections

Blog posts use Astro content collections defined in `src/content/config.ts`:

- **Schema fields:** `title`, `date`, `author`, `category`, `tags?`, `image?`, `excerpt?`, `draft?`
- **Categories:** `'Comunicato del direttivo'`, `'News'`, `'Coppa Colli Euganei'`, `'Convenzioni'`
- **Filename format:** `YYYY-MM-DD-slug.md`
- Posts with `draft: true` are filtered out in page queries

### Registration Flow

- Registration is handled externally via Eventbrite
- The site links to the Eventbrite page and provides a QR code for quick access
- Form validation schemas in `shared/schemas.ts` (Zod) for registration & membership forms

### Deployment

- Push to `main` triggers GitHub Actions → Astro build → GitHub Pages deploy
- CI uses Node 20, `npm ci`, builds with site/base from GitHub Pages config

## Site Pages

| Page           | Route             | Description                         |
| -------------- | ----------------- | ----------------------------------- |
| Homepage       | `/`               | Hero + latest blog posts + sections |
| Chi Siamo      | `/chi-siamo`      | About the club                      |
| Magna & Pedala | `/magna-e-pedala` | Main event page                     |
| Galleria       | `/galleria`       | Photo gallery                       |
| Tesseramento   | `/tesseramento`   | Membership info                     |
| Contatti       | `/contatti`       | Contact information                 |
| Privacy        | `/privacy`        | Privacy policy                      |
| Blog           | `/blog`           | Blog listing                        |
| Blog Post      | `/blog/[slug]`    | Individual post                     |
| RSS            | `/rss.xml`        | RSS feed                            |

**Not yet implemented:** Percorsi (Routes), Iscrizioni (Registration form), Partecipanti (Participants list)

## Integrations

- YouTube (video embeds via `YouTubeEmbed` component)
- Instagram (feed via `InstagramFeed` component)
- Strava (club feed via `StravaClubFeed` component)
- WhatsApp (contact button via `WhatsAppButton` component)

## Scripts & Tooling

- **Blog migration** (`scripts/migrate-blog/`): Converts old site HTML posts to Astro-compatible markdown with frontmatter. Has its own `package.json`.
- **WhatsApp gallery** (`scripts/whatsapp-gallery/`): Pipeline to import images from WhatsApp groups into the gallery. Uses catalog/descriptions JSON files and snapshot-based deduplication.
- **Site crawl** (`scripts/crawl-site.*`): Crawl scripts (Python/Bash/PowerShell) for mirroring the old site.

## Reference Materials

- `crawled-site/` - Mirror of existing estebike.it website (2013-2024 content for migration)
- `assets/estebike-logo.png` - Main logo
- `docs/social-media-links.txt` - Social media URLs

## Language

The site content is in **Italian**. All user-facing text, form labels, validation messages, and blog posts are in Italian.
