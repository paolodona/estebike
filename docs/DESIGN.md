# EsteBike Website Design System

## Design Philosophy

Inspired by **Jesolo Gravel** - a clean, friendly, community-focused aesthetic that emphasizes the joy of cycling and local community. The design should feel welcoming and approachable, not intimidating or overly competitive.

**Key Principles:**
- **Warmth:** Inviting colors that reflect the cycling community spirit
- **Clarity:** Easy-to-scan information hierarchy
- **Photography-driven:** Let beautiful cycling imagery tell the story
- **Simplicity:** Minimalist UI that doesn't compete with content

---

## Color Palette

### Primary Colors
```css
--color-primary: #1E3A5F;      /* Deep Navy - trust, stability */
--color-primary-light: #2D5A8A; /* Lighter navy for hover states */
--color-primary-dark: #0F1F33;  /* Dark navy for text */
```

### Accent Colors
```css
--color-accent: #E07B39;        /* Warm Orange - energy, enthusiasm */
--color-accent-light: #F4A261;  /* Light orange for highlights */
--color-accent-dark: #C45D1A;   /* Dark orange for hover */
```

### Neutral Colors
```css
--color-white: #FFFFFF;
--color-off-white: #F8F9FA;     /* Background sections */
--color-gray-100: #E9ECEF;      /* Borders, dividers */
--color-gray-300: #ADB5BD;      /* Muted text */
--color-gray-600: #6C757D;      /* Secondary text */
--color-gray-900: #212529;      /* Body text */
--color-black: #000000;
```

### Semantic Colors
```css
--color-success: #28A745;       /* Confirmation, available */
--color-warning: #FFC107;       /* Alerts, deadlines */
--color-error: #DC3545;         /* Errors, sold out */
--color-info: #17A2B8;          /* Information */
```

---

## Typography

### Font Stack
```css
/* Headings - Modern, bold, friendly */
--font-heading: 'Montserrat', 'Segoe UI', sans-serif;

/* Body - Clean, readable */
--font-body: 'Open Sans', 'Segoe UI', sans-serif;

/* Accent/Display - For special callouts */
--font-display: 'Montserrat', sans-serif;
```

### Type Scale
```css
--text-xs: 0.75rem;     /* 12px - captions */
--text-sm: 0.875rem;    /* 14px - small text */
--text-base: 1rem;      /* 16px - body */
--text-lg: 1.125rem;    /* 18px - lead text */
--text-xl: 1.25rem;     /* 20px - small headings */
--text-2xl: 1.5rem;     /* 24px - h4 */
--text-3xl: 1.875rem;   /* 30px - h3 */
--text-4xl: 2.25rem;    /* 36px - h2 */
--text-5xl: 3rem;       /* 48px - h1 */
--text-6xl: 3.75rem;    /* 60px - hero */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## Layout

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Grid System
- 12-column grid for flexibility
- Gap: `--space-6` (24px) default
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3-4 columns for galleries, 2 for content

### Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

---

## Components

### Navigation

**Desktop:**
- Fixed header with transparent-to-solid on scroll
- Logo left, menu items center/right
- CTA button highlighted (e.g., "Iscriviti")
- Height: 80px

**Mobile:**
- Hamburger menu
- Full-screen overlay navigation
- Logo centered
- Height: 60px

```
[Logo]     [Chi Siamo] [Magna & Pedala] [Galleria] [Contatti]  [ISCRIVITI]
```

### Hero Section

**Layout:**
- Full viewport height (100vh) or 80vh
- Large background image with dark overlay
- Centered content
- Event name in display font
- Date prominently displayed
- Primary CTA button

**Example:**
```
┌─────────────────────────────────────────────┐
│                                             │
│              [ESTEBIKE LOGO]                │
│                                             │
│            MAGNA & PEDALA                   │
│               2026                          │
│                                             │
│          15 Maggio 2026 • Este              │
│                                             │
│           [ ISCRIVITI ORA ]                 │
│                                             │
└─────────────────────────────────────────────┘
```

### Buttons

**Primary Button:**
```css
background: var(--color-accent);
color: white;
padding: var(--space-3) var(--space-6);
border-radius: 4px;
font-weight: var(--font-semibold);
transition: background 0.2s;
/* Hover: var(--color-accent-dark) */
```

**Secondary Button:**
```css
background: transparent;
border: 2px solid var(--color-primary);
color: var(--color-primary);
/* Hover: filled with primary */
```

**Ghost Button (on dark backgrounds):**
```css
background: transparent;
border: 2px solid white;
color: white;
/* Hover: white background, dark text */
```

### Cards

**Event/Route Card:**
```
┌─────────────────────────────┐
│         [IMAGE]             │
│                             │
├─────────────────────────────┤
│  Route Name                 │
│  65km • 800m D+             │
│  ─────────────────          │
│  Brief description...       │
│                             │
│  [Scarica GPX] [Vedi Mappa] │
└─────────────────────────────┘
```

**Sponsor Card:**
```
┌───────────────┐
│               │
│    [LOGO]     │
│               │
└───────────────┘
```
- Grayscale by default, color on hover
- Uniform height, logos centered

### Gallery

**Grid Layout:**
- Masonry or uniform grid
- Lightbox on click
- Lazy loading
- 3 columns desktop, 2 tablet, 1 mobile

### Forms

**Input Fields:**
```css
border: 1px solid var(--color-gray-300);
border-radius: 4px;
padding: var(--space-3) var(--space-4);
font-size: var(--text-base);
/* Focus: border-color: var(--color-primary) */
```

**Labels:**
- Above input
- Font weight: medium
- Required indicator: orange asterisk

### Footer

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO]                                                 │
│                                                         │
│  EsteBike ASD                 Link Utili    Seguici     │
│  Via Example 123              Chi Siamo     [IG] [FB]   │
│  35042 Este (PD)              Magna&Pedala  [Strava]    │
│  info@estebike.it             Galleria                  │
│                               Tesseramento              │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  © 2026 EsteBike ASD • P.IVA: XXXXXXXXXXX              │
│  [Sponsors logos strip]                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Page Layouts

### Homepage Structure

```
1. [Navigation - fixed]
2. [Hero - full height]
3. [Announcements - if any]
4. [Event Highlight Section]
5. [About Club Teaser]
6. [Routes Preview - 3 cards]
7. [Gallery Preview - image grid]
8. [Strava Club Feed Widget]
9. [Instagram Feed]
10. [Sponsors Section]
11. [Footer]
```

### Event Page Structure

```
1. [Navigation]
2. [Hero with event image]
3. [Event Info - date, location, key stats]
4. [Route Options - cards]
5. [Schedule/Timeline]
6. [What's Included]
7. [Registration CTA]
8. [FAQ Accordion]
9. [Footer]
```

### Registration Page Structure

```
1. [Navigation]
2. [Page Header]
3. [Registration Form]
   - Personal Info
   - Route Selection
   - Emergency Contact
   - Terms Checkbox
4. [Price Display]
5. [Stripe Checkout Button]
6. [Footer]
```

---

## Imagery Guidelines

### Photography Style
- **Natural lighting:** Outdoor shots in golden hour preferred
- **Community focus:** Group shots, smiling faces, camaraderie
- **Local landscape:** Este hills, countryside, recognizable landmarks
- **Action + candid:** Mix of riding shots and rest stop moments

### Image Specifications
- Hero images: 1920x1080 minimum, 16:9 ratio
- Card thumbnails: 800x600, 4:3 ratio
- Gallery images: 1200px width max
- Format: WebP with JPG fallback
- Compression: 80% quality

### Placeholder/Default Images
- Have fallback images for missing content
- Use blurred/tinted photos as section backgrounds

---

## Animations & Interactions

### Principles
- Subtle and purposeful
- No animation for animation's sake
- Respect reduced-motion preferences

### Specific Animations
- **Scroll reveal:** Fade up for sections (200ms ease-out)
- **Button hover:** Background transition (200ms)
- **Image hover:** Slight scale (1.02) with shadow
- **Navigation:** Smooth scroll for anchor links
- **Lightbox:** Fade in overlay, scale image

### Loading States
- Skeleton screens for dynamic content
- Spinner for form submissions
- Progress indicator for image galleries

---

## Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Hamburger navigation
- Stacked cards
- Reduced padding (--space-4)
- Hero text smaller (--text-4xl)

### Tablet (768px - 1024px)
- Two column grids
- Navigation visible but condensed
- Hero at 80vh

### Desktop (> 1024px)
- Full layout as designed
- Hover states active
- Maximum container width applied

---

## Dark Mode (Optional/Future)

If implemented later:
```css
/* Dark mode overrides */
--color-background: #121212;
--color-surface: #1E1E1E;
--color-text: #E0E0E0;
--color-text-muted: #A0A0A0;
/* Keep accent colors vibrant */
```

---

## Accessibility Checklist

- [ ] Color contrast ratio 4.5:1 minimum
- [ ] Focus visible states on all interactive elements
- [ ] Alt text on all images
- [ ] Semantic HTML structure
- [ ] Skip to content link
- [ ] Form labels properly associated
- [ ] Error messages announced to screen readers
- [ ] Touch targets 44x44px minimum

---

## File Structure Suggestion

```
/src
  /components
    /ui
      Button.astro
      Card.astro
      Input.astro
    /layout
      Header.astro
      Footer.astro
      Hero.astro
    /sections
      Sponsors.astro
      Gallery.astro
      StravaFeed.astro
      InstagramFeed.astro
  /layouts
    BaseLayout.astro
    EventLayout.astro
  /pages
    index.astro
    chi-siamo.astro
    magna-e-pedala/
      index.astro
      percorsi.astro
      iscrizioni.astro
      partecipanti.astro
    galleria.astro
    tesseramento.astro
    contatti.astro
  /content
    /announcements
    /routes
    /gallery
  /styles
    global.css
    variables.css
/public
  /images
  /sponsors
  /fonts
```

---

## Tools & Resources

### Fonts
- Google Fonts: Montserrat, Open Sans

### Icons
- Lucide Icons or Heroicons (lightweight, consistent)

### CSS Framework
- Tailwind CSS (optional, integrates well with Astro)
- Or custom CSS with CSS variables

### Image Optimization
- Astro Image integration
- Squoosh for manual optimization

### Testing
- Lighthouse for performance
- WAVE for accessibility
- BrowserStack for cross-browser

---

## Implementation Priority

1. **Phase 1:** Core pages (Home, Event, Registration)
2. **Phase 2:** Routes with maps, Participant list
3. **Phase 3:** Gallery, Instagram/Strava integration
4. **Phase 4:** Membership, polish, optimizations
