# Contributing to EsteBike

This document describes how to set up the development environment and contribute to the EsteBike website.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm, pnpm, or yarn
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/estebike/estebike.git
cd estebike
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:4321`.

## Project Structure

```
/src
  /components
    /ui/           # Reusable UI components (Button, Card, Input, etc.)
    /layout/       # Layout components (Header, Footer, Hero)
    /sections/     # Page sections (Sponsors, Gallery, feeds)
    /forms/        # Form components
  /layouts/        # Page layouts (BaseLayout, etc.)
  /pages/          # Astro pages (routes)
  /content/
    /blog/         # Blog posts (markdown)
  /styles/         # CSS files (variables.css, global.css)
/public
  /images/         # Static images
  /gpx/            # GPX route files
  /sponsors/       # Sponsor logos
/worker            # Cloudflare Worker (backend API)
```

## Development Workflow

### Working with Content

Blog posts are stored as Markdown files in `/src/content/blog/`. Each post requires frontmatter:

```yaml
---
title: "Post Title"
date: 2026-01-15
author: "admin"
category: "News"
tags: ["tag1", "tag2"]
excerpt: "Brief description"
---

Post content here...
```

### Working with Styles

- All CSS custom properties are defined in `/src/styles/variables.css`
- Global styles are in `/src/styles/global.css`
- Component-specific styles use `<style>` blocks in `.astro` files
- **Mobile-first**: Write base styles for mobile, use `min-width` media queries

### Working with Components

Components are organized by purpose:

- **ui/**: Atomic, reusable components (Button, Card, Badge)
- **layout/**: Structural components (Header, Footer, Hero)
- **sections/**: Composed sections used on pages
- **forms/**: Form-related components

## Backend Development (Cloudflare Worker)

The backend API is in the `/worker` directory. To develop locally:

```bash
cd worker
npm install
npx wrangler dev
```

This starts the Worker at `http://localhost:8787`.

### Environment Variables

Create a `.env.local` file in the project root:

```
PUBLIC_API_URL=http://localhost:8787
```

Worker secrets are managed via `wrangler secret`:

```bash
wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
wrangler secret put STRIPE_SECRET_KEY
```

## Testing Stripe Locally

Use the Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:8787/webhook/stripe
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code formatting |
| `npm run format` | Fix code formatting |

## Code Style

- Use Prettier for formatting (configured in `.prettierrc`)
- Follow the existing code patterns
- Write mobile-first CSS
- Use CSS custom properties from `variables.css`
- Ensure touch targets are at least 44x44px

## Deployment

The site automatically deploys to GitHub Pages when pushing to `main`.

The Cloudflare Worker deploys separately:

```bash
cd worker
wrangler publish
```

## Need Help?

- Open an issue on GitHub
- Contact the team at info@estebike.it
