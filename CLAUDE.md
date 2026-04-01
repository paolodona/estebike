# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EsteBike is a website project for a cycling club based in Este (Padova, Veneto, Italy). The project is currently in the **planning/documentation phase** - no Astro code has been written yet.

**Target Stack:**
- Framework: Astro (static site generator)
- Hosting: GitHub Pages
- Ticketing: Eventbrite (https://estebikemangnaepedala2026.eventbrite.com/)

## Key Documentation

Before implementing any feature, read:
- `docs/SPECS.md` - Technical specifications, site structure, registration flow, integrations
- `docs/DESIGN.md` - Complete design system with colors, typography, components, layouts

## Critical Design Constraints

### Mobile-First (Primary Requirement)
- **Design for mobile screens first**, then enhance for larger screens with `min-width` media queries
- Never write desktop-first CSS
- Minimum touch targets: 44x44px
- No horizontal scrolling

### Brand Colors (Este Coat of Arms)
```css
--color-primary: #C41E3A;  /* Este Red */
--color-accent: #F7D000;   /* Este Gold */
--color-charcoal: #2D2D2D; /* Primary text */
```
- Yellow text should NEVER appear on white backgrounds
- Yellow works as badges/buttons on red or dark backgrounds

### Typography
- Headings: Montserrat
- Body: Open Sans

## Architecture Notes

### Registration Flow
- Registration is handled externally via Eventbrite
- The site links to the Eventbrite page and provides a QR code for quick access

### Content Management
- Blog posts: Markdown files in `/src/content/blog/`
- Filename format: `YYYY-MM-DD-slug.md`

## Project Structure (Planned)

```
/src
  /components/ui/       # Button, Card, Input components
  /components/layout/   # Header, Footer, Hero
  /components/sections/ # Sponsors, Gallery, feeds
  /layouts/             # BaseLayout, EventLayout
  /pages/               # Astro pages
  /content/blog/        # Blog posts (markdown)
  /styles/              # global.css, variables.css
/public
  /images, /sponsors, /fonts
```

## Reference Materials

- `crawled-site/` - Mirror of existing estebike.it website (2013-2024 content for migration)
- `assets/estebike-logo.png` - Main logo
- `docs/social-media-links.txt` - Social media URLs

## Site Pages

Homepage, Chi Siamo (About), Magna & Pedala (Event), Percorsi (Routes), Iscrizioni (Registration), Partecipanti (Participants), Galleria, Tesseramento (Membership), Contatti, Blog/News

## Integrations

YouTube (video embeds), Instagram (feed), Strava (route embeds, club feed), WhatsApp (contact button)
