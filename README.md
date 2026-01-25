# EsteBike

Website for EsteBike cycling club based in Este (Padova, Veneto, Italy). Features the annual "Magna & Pedala" sportive event.

## Tech Stack

- **Frontend**: Astro 5.x (static site)
- **Hosting**: GitHub Pages
- **Backend**: Cloudflare Workers (API for registration, payments)
- **Payments**: Stripe Checkout
- **Database**: Google Sheets

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Frontend (Astro)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The site will be available at `http://localhost:4321`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code formatting |
| `npm run format` | Fix code formatting |

### Backend (Cloudflare Worker)

The worker handles registration forms, Stripe payments, and participant data.

```bash
cd worker

# Install dependencies
npm install

# Start local worker
npx wrangler dev
```

The API will be available at `http://localhost:8787`.

#### Worker Environment Variables

Before running the worker, configure secrets:

```bash
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
npx wrangler secret put GOOGLE_SPREADSHEET_ID
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_EMAIL
```

#### Testing Stripe Webhooks Locally

```bash
# In a separate terminal
stripe listen --forward-to localhost:8787/webhook/stripe
```

## Project Structure

```
src/
  components/
    ui/           # Button, Card, Input, Badge, Icon
    layout/       # Header, Footer, Hero
    sections/     # Sponsors, social feeds
    forms/        # Registration, membership forms
  layouts/        # BaseLayout
  pages/          # Astro pages
  content/blog/   # Blog posts (markdown)
  styles/         # CSS variables, global styles
public/
  images/         # Logos, gallery
  gpx/            # Route GPS files
worker/           # Cloudflare Worker API
```

## Deployment

The site auto-deploys to GitHub Pages on push to `main` via GitHub Actions.

Worker deployment:

```bash
cd worker
npx wrangler deploy
```

## Documentation

- `docs/SPECS.md` - Technical specifications
- `docs/DESIGN.md` - Design system
- `CLAUDE.md` - AI assistant instructions
- `CONTRIBUTING.md` - Development workflow
