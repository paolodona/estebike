# Original Prompt: EsteBike Website Implementation
Plan: 001 | Name: estebike-site | Created: 2026-01-25 | GitRef: 63d147f

## Related Files
- **Context**: `.agent_session/001_estebike-site_context.md` - Research findings
- **Plan**: `.agent_session/001_estebike-site_plan.md` - Implementation steps

---

## Original User Request

> to implement the new estebike site as per @docs\ design and specs

---

## Refined Prompt

Implement the complete EsteBike cycling club website following the technical specifications and design system.

**Architectural Mandate**:
This project follows Astro's component-based architecture with a "Shared First" principle:
- All reusable UI elements MUST go in `/src/components/ui/` (Button, Card, Input, Badge, etc.)
- Layout components MUST go in `/src/components/layout/` (Header, Footer, Hero)
- Section-specific components MUST go in `/src/components/sections/` (Sponsors, Gallery, feeds)
- CSS variables MUST be defined in `/src/styles/variables.css` and imported globally
- All pages MUST use `BaseLayout.astro` to ensure consistent structure
- Mobile-first CSS is MANDATORY - all base styles target mobile, enhanced via `min-width` media queries

**Pre-Implementation Analysis Required**:
1. **Review existing assets**: Check `crawled-site/` for content to migrate (blog posts from 2013-2024, images, text)
2. **Review brand assets**: Verify logo files in `assets/` and required logo versions per DESIGN.md
3. **Review social links**: Check `docs/social-media-links.txt` for integration URLs
4. **Identify external dependencies**: Determine optimal packages for Stripe, Google Sheets API, email service integration

**Phased Implementation** (per DESIGN.md priority):

**Phase 1 - Core Foundation & Pages**:
- Initialize Astro project with proper structure
- Create CSS variables file with full design token system
- Build core UI components: Button, Card, Input, Badge
- Build layout components: Header, Footer, Hero
- Build BaseLayout.astro with proper SEO meta tags
- Create pages: Homepage, Chi Siamo, Magna & Pedala, Contatti
- Blog system with Astro content collections

**Phase 2 - Routes & Participants**:
- Percorsi page with Strava embed and GPX downloads
- Iscrizioni page with registration form
- Partecipanti page displaying Google Sheets data
- Cloudflare Worker for registration flow

**Phase 3 - Media & Social Integration**:
- Galleria page with grid layout and lightbox
- Instagram feed, Strava widget, YouTube embeds

**Phase 4 - Membership & Polish**:
- Tesseramento page
- Sponsors section
- Performance and accessibility optimization

**Scope**:
- IN: All 10 pages, design system, Cloudflare Worker, Stripe, Google Sheets, blog
- OUT: Multi-language, member login, dark mode, payment webhooks

**Key Technical Constraints**:
- Italian language ONLY
- Mobile-first CSS is PRIMARY REQUIREMENT
- Touch targets minimum 44x44px
- Yellow text NEVER on white backgrounds
- Fonts: Montserrat (headings) + Open Sans (body)
- Image format: WebP with JPG fallback

**Reference Documents**:
- `docs/SPECS.md` - Technical specifications
- `docs/DESIGN.md` - Design system
- `crawled-site/` - Content for migration
- `assets/estebike-logo.png` - Brand logo
