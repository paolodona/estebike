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

### Content Management
- **Primary:** Markdown files in Git repository
- **Updates:** Edit markdown, push to GitHub, automatic rebuild
- **Participant List:** Google Sheets integration (live updates)

### Payments
- **Provider:** Stripe Checkout
- **Use Cases:**
  - Event registration (Magna & Pedala)
  - Annual club membership

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

### Pricing
- **Single price** for all participants (amount TBD)
- Same price regardless of route choice

### Notifications
- **Admin notification:** Email to club on each registration
- **Stripe dashboard:** Backup notification via Stripe

### Participant List
- **Public display:** Searchable list of registered participants
- **Data source:** Google Sheets (live sync)
- **Displayed fields:** Name, route choice, registration date

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
- Separate Stripe Checkout flow
- Same form structure as event (basic info)
- Annual membership fee (amount TBD)

### Data Collected
- Name, email, phone
- Address (for membership card)

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
| GitHub Pages | Hosting | Free |
| Stripe | Payments | ~1.4% + €0.25 per transaction |
| Google Sheets | Participant list | Free |
| YouTube | Video hosting | Free |
| Instagram | Feed embed | Free |
| Strava | Route embeds, club feed | Free |
| WhatsApp | Contact button | Free |

**Estimated monthly cost: €0** (only per-transaction Stripe fees)

---

## Future Considerations

- Multi-language support (English) if event grows
- Member login portal
- Automated email confirmations to participants
- Online results/timing integration
