# EsteBike Website Design System

## Brand Identity

### Heritage & Theme

EsteBike's visual identity is rooted in the **civic heraldry of Este** (Padova, Veneto). The club's colors directly reference the **Stemma di Este** (Este coat of arms) - a yellow/gold cross on a red field, featuring the iconic castle tower silhouette.

**Brand Story:**

- Founded in **1996** - nearly 30 years of cycling tradition
- Colors represent **local pride** and deep connection to Este's history
- The yellow/red combination is instantly recognizable in the local cycling community
- The jersey design (yellow with red cross) maximizes visibility while honoring tradition

**Brand Personality:**

- **Local & Proud:** Strong connection to Este and the Colli Euganei
- **Community-focused:** Welcoming to all skill levels
- **Energetic:** Vibrant colors reflect enthusiasm for cycling
- **Authentic:** No-frills, genuine cycling culture since 1996

---

## Logo Usage

### Primary Logo

The main logo features "ESTE BIKE" text flanking the Este coat of arms emblem, with "1996" and "zordan" below.

### Logo Versions Needed

**1. Full Color on Red (Primary):**

- For use on red backgrounds (navigation, hero sections)
- Text in white with subtle shadow
- Emblem: yellow cross with castle on lighter background
- File: `estebike-logo-white.svg`

**2. Full Color on White/Light:**

- For use on white or cream backgrounds
- Text in charcoal (--color-charcoal)
- Emblem: full color (yellow and red)
- File: `estebike-logo.svg` (current)

**3. Monochrome White:**

- For footer and dark backgrounds
- All-white version
- File: `estebike-logo-mono-white.svg`

**4. Favicon/Icon:**

- Just the Este coat of arms emblem
- Works at small sizes
- File: `estebike-icon.svg`

### Clear Space

Maintain minimum clear space around logo equal to the height of the "E" in "ESTE".

### Minimum Size

- Web: 120px width minimum for full logo
- Favicon: 32x32px minimum for icon version

---

## Design Philosophy

A modern, mobile-first design that honors EsteBike's heritage while feeling fresh and contemporary. The design should feel welcoming and approachable, not intimidating or overly competitive.

**Key Principles:**

- **Mobile-first:** Design for phones first, enhance for larger screens. The mobile experience IS the experience.
- **On-brand:** Colors and visual language reflect the Este civic identity
- **Clarity:** Easy-to-scan information hierarchy
- **Photography-driven:** Let beautiful cycling imagery tell the story
- **Simplicity:** Minimalist UI that doesn't compete with content

---

## Color Palette

### Primary Colors - Este Red

The signature red from the Este coat of arms. Used as the primary brand color for headers, CTAs, and key UI elements.

```css
--color-primary: #c41e3a; /* Este Red - heritage, energy, passion */
--color-primary-light: #e63950; /* Lighter red for hover states */
--color-primary-dark: #9a1830; /* Darker red for active states */
--color-primary-900: #5c0f1e; /* Very dark red for text on light backgrounds */
```

### Accent Colors - Este Gold/Yellow

The vibrant yellow from the Este coat of arms. Used sparingly for highlights, badges, and accent elements.

```css
--color-accent: #f7d000; /* Este Gold - energy, visibility, optimism */
--color-accent-light: #ffe44d; /* Light gold for backgrounds */
--color-accent-dark: #d4b000; /* Darker gold for hover states */
--color-accent-muted: #fff8cc; /* Very light gold for subtle highlights */
```

### Neutral Colors - Charcoal & Grays

The dark charcoal from the logo text, extended into a full neutral palette for readability.

```css
--color-charcoal: #2d2d2d; /* Primary text, from logo */
--color-charcoal-light: #4a4a4a; /* Secondary headings */
--color-white: #ffffff;
--color-off-white: #fafafa; /* Background sections */
--color-cream: #fdf9f3; /* Warm off-white, pairs with yellow */
--color-gray-100: #f0f0f0; /* Light backgrounds */
--color-gray-200: #e0e0e0; /* Borders, dividers */
--color-gray-400: #9e9e9e; /* Muted text, placeholders */
--color-gray-600: #616161; /* Secondary text */
--color-gray-800: #424242; /* Body text alternative */
```

### Semantic Colors

```css
--color-success: #2e7d32; /* Confirmation, available - green that works with red */
--color-warning: #f9a825; /* Alerts, deadlines - uses accent gold family */
--color-error: #c62828; /* Errors, sold out - darker than primary red */
--color-info: #1565c0; /* Information - blue for contrast */
```

### Color Usage Guidelines

**Primary (Red) - 60%:**

- Navigation bar background
- Primary buttons and CTAs
- Hero overlays
- Section headers
- Footer background

**Accent (Yellow) - 10%:**

- Highlight badges ("Novità", "Iscrizioni Aperte")
- Icon accents
- Hover states on dark backgrounds
- Price callouts
- Secondary buttons on red backgrounds

**Neutrals - 30%:**

- Body text (charcoal)
- Card backgrounds (white/off-white)
- Content sections
- Form inputs

**Contrast Considerations:**

- Yellow text should NEVER appear on white backgrounds (poor contrast)
- Yellow works well as badges/pills on red or dark backgrounds
- Red text on white: use --color-primary-900 for body text
- White text on red: excellent contrast, use for CTAs and headers

### Sample Color Combinations

**Navigation Bar:**

```
Background: --color-primary (#C41E3A)
Text: white
CTA Button: --color-accent (#F7D000) with --color-charcoal text
```

**Hero Section:**

```
Overlay: linear-gradient(rgba(196, 30, 58, 0.8), rgba(154, 24, 48, 0.9))
Headline: white
Subheadline: white (80% opacity)
CTA: --color-accent button with --color-charcoal text
```

**Content Section (Light):**

```
Background: --color-off-white (#FAFAFA)
Headline: --color-charcoal (#2D2D2D)
Body text: --color-gray-800 (#424242)
Links: --color-primary (#C41E3A)
Accent badges: --color-accent on red, or red on light
```

**Feature Section (Red):**

```
Background: --color-primary (#C41E3A)
Text: white
Accent elements: --color-accent (#F7D000)
Buttons: white outline or yellow fill
```

**Card Component:**

```
Background: white
Border: 1px solid --color-gray-200
Title: --color-charcoal
Meta text: --color-gray-600
CTA link: --color-primary
Hover: subtle shadow + optional red left border
```

**Footer:**

```
Background: --color-primary-dark (#9A1830)
Text: white
Muted text: white (60% opacity)
Links hover: --color-accent
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
--text-xs: 0.75rem; /* 12px - captions */
--text-sm: 0.875rem; /* 14px - small text */
--text-base: 1rem; /* 16px - body */
--text-lg: 1.125rem; /* 18px - lead text */
--text-xl: 1.25rem; /* 20px - small headings */
--text-2xl: 1.5rem; /* 24px - h4 */
--text-3xl: 1.875rem; /* 30px - h3 */
--text-4xl: 2.25rem; /* 36px - h2 */
--text-5xl: 3rem; /* 48px - h1 */
--text-6xl: 3.75rem; /* 60px - hero */
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
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
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
--breakpoint-sm: 640px; /* Mobile landscape */
--breakpoint-md: 768px; /* Tablet */
--breakpoint-lg: 1024px; /* Desktop */
--breakpoint-xl: 1280px; /* Large desktop */
```

---

## Components

### Navigation

**Desktop:**

- Fixed header with red background (--color-primary)
- Logo left (white version on red), menu items center/right in white
- CTA button in yellow accent (--color-accent) with dark text
- Height: 80px
- On scroll: subtle shadow added

**Mobile:**

- Red hamburger menu icon on red header
- Full-screen red overlay navigation
- Logo centered (white version)
- Height: 60px
- Menu items in white, large touch targets

```
[Logo]     [Chi Siamo] [Magna & Pedala] [Galleria] [Contatti]  [ISCRIVITI]
  white         white text links                              yellow button
```

### Hero Section

**Layout:**

- Full viewport height (100vh) or 80vh
- Large background image with **red gradient overlay** (--color-primary at 70% opacity)
- Centered content in white
- Event name in display font
- Date prominently displayed
- Yellow accent CTA button for maximum contrast

**Example:**

```
┌─────────────────────────────────────────────┐
│           Red gradient overlay              │
│                                             │
│         [ESTEBIKE LOGO - white]             │
│                                             │
│            MAGNA & PEDALA                   │
│               2026                          │
│           (white display text)              │
│                                             │
│          15 Maggio 2026 • Este              │
│                                             │
│         [ ISCRIVITI ORA ]                   │
│          (yellow button)                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Buttons

**Primary Button (Red):**

```css
background: var(--color-primary);
color: white;
padding: var(--space-3) var(--space-6);
border-radius: 4px;
font-weight: var(--font-semibold);
transition: all 0.2s ease;
/* Hover: var(--color-primary-dark), slight lift shadow */
```

**Secondary Button (Outlined):**

```css
background: transparent;
border: 2px solid var(--color-primary);
color: var(--color-primary);
/* Hover: filled with primary, white text */
```

**Accent Button (Yellow on Red backgrounds):**

```css
background: var(--color-accent);
color: var(--color-charcoal);
font-weight: var(--font-bold);
/* Use only on red/dark backgrounds for contrast */
/* Hover: var(--color-accent-dark) */
```

**Ghost Button (on dark/red backgrounds):**

```css
background: transparent;
border: 2px solid white;
color: white;
/* Hover: white background, red text */
```

**Ghost Button (on yellow backgrounds):**

```css
background: transparent;
border: 2px solid var(--color-charcoal);
color: var(--color-charcoal);
/* Hover: charcoal background, white text */
```

### Cards

**Event/Route Card:**

```
┌─────────────────────────────┐
│         [IMAGE]             │
│    (red overlay on hover)   │
├─────────────────────────────┤
│  [Yellow badge: "65km"]     │
│  Route Name                 │
│  800m D+ • Gravel           │
│  ─────────────────          │
│  Brief description...       │
│                             │
│  [Scarica GPX] [Vedi Mappa] │
│   (red links)               │
└─────────────────────────────┘
```

- White background, subtle shadow
- Red accent bar on left edge (optional)
- Yellow badges for key stats
- Red text links for actions

**Blog Post Card:**

```
┌─────────────────────────────┐
│         [IMAGE]             │
│        (optional)           │
├─────────────────────────────┤
│  [Red tag: Categoria]       │
│  Post Title Here            │
│  (charcoal, bold)           │
│  ─────────────────          │
│  15 Gen 2026 (gray)         │
│  Brief excerpt text that    │
│  summarizes the post...     │
│                             │
│  [Leggi tutto →] (red)      │
└─────────────────────────────┘
```

- Date in muted gray
- Category tag in red with light red background
- "Read more" link in primary red
- Hover: subtle lift and shadow

**Sponsor Card:**

```
┌───────────────┐
│               │
│    [LOGO]     │
│ (grayscale)   │
└───────────────┘
```

- Grayscale by default, full color on hover
- Uniform height, logos centered
- Optional: subtle red border on hover

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

**Design:**

- Background: --color-primary-dark (dark red)
- Text: white and --color-gray-400 for secondary
- Links: white, hover to --color-accent (yellow)
- Social icons: white, hover to yellow
- Divider: --color-primary-light

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO - white version]              (dark red bg)      │
│                                                         │
│  EsteBike ASD                 Link Utili    Seguici     │
│  Via Example 123              Chi Siamo     [IG] [FB]   │
│  35042 Este (PD)              Magna&Pedala  [Strava]    │
│  info@estebike.it             Galleria                  │
│    (white text)               Tesseramento              │
│                               (white links → yellow)    │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  © 2026 EsteBike ASD • Dal 1996                        │
│  [Sponsors logos strip - grayscale/white]              │
└─────────────────────────────────────────────────────────┘
```

---

## Page Layouts

### Homepage Structure

```
1. [Navigation - fixed]
2. [Hero - full height]
3. [Latest News - 3-5 blog post cards]
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

### Blog Archive Page Structure

```
1. [Navigation]
2. [Page Header - "News & Aggiornamenti"]
3. [Blog Post List - cards or list view]
   - Paginated (10 per page)
   - Each entry: date, title, excerpt, category
4. [Pagination controls]
5. [Footer]
```

### Single Blog Post Structure

```
1. [Navigation]
2. [Featured Image - if present]
3. [Post Header]
   - Title
   - Date, Author, Category
4. [Post Content - markdown rendered]
5. [Tags]
6. [Previous/Next Navigation]
7. [Footer]
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

## Responsive Behavior (MOBILE-FIRST)

**CRITICAL: This site is mobile-first.** All CSS and components must be written for mobile screens as the baseline, with `min-width` media queries to enhance for larger screens. Never write desktop-first CSS that gets overridden for mobile.

### Mobile - THE DEFAULT (< 768px)

This is the PRIMARY design. All styles without media queries target mobile.

- Single column layout
- Hamburger navigation with full-screen overlay
- Stacked cards, full-width
- Comfortable padding (--space-4)
- Readable text sizes (--text-base minimum for body)
- Large touch targets (44x44px minimum)
- Hero text sized for mobile (--text-4xl)
- No hover-dependent interactions

### Tablet (min-width: 768px)

Progressive enhancement from mobile:

- Two column grids where appropriate
- Navigation can expand (optional)
- Hero at 80vh
- Slightly increased spacing

### Desktop (min-width: 1024px)

Further enhancement:

- Multi-column layouts (3-4 columns for galleries)
- Full navigation visible
- Hover states enabled
- Maximum container width applied
- Increased whitespace and padding

---

## Dark Mode (Optional/Future)

If implemented later, maintain brand recognition:

```css
/* Dark mode overrides */
--color-background: #1a1a1a;
--color-surface: #252525;
--color-text: #f0f0f0;
--color-text-muted: #a0a0a0;
/* Keep brand colors vibrant */
--color-primary: #e63950; /* Slightly lighter red for dark bg */
--color-accent: #ffd633; /* Slightly lighter yellow */
/* Red surfaces become darker but stay red */
--color-primary-surface: #3d1520; /* Dark red for sections */
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
    blog/
      index.astro           # Blog archive with pagination
      [...slug].astro       # Dynamic blog post pages
    magna-e-pedala/
      index.astro
      percorsi.astro
      iscrizioni.astro
      partecipanti.astro
    galleria.astro
    tesseramento.astro
    contatti.astro
  /content
    /blog          # Blog posts (markdown files)
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
