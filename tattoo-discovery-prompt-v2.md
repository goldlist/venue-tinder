# Claude Code Prompt v2: Tattoo Artist Discovery App (Tinder-style)

## Project Overview

Build a standalone mobile-first React web app (Vite + Tailwind + Framer Motion) called **"Discover by Venue"** — a Tinder-style tattoo flash discovery experience that feeds into the Venue booking platform.

---

## Step 1: Process the Data

The file `data/flash_data.csv` contains all artist and flash data. Process it as follows:

### Image URL conversion
All image URLs in the CSV start with `s3://venue-ink-prd-app/`. Convert them to public URLs by replacing that prefix with `https://venue.ink/`.

Example:
- Input: `s3://venue-ink-prd-app/static/people/per-8Y8jb5HLUnY/flash_images/fli-8pwc0OyFrOK/flash.webp`
- Output: `https://venue.ink/static/people/per-8Y8jb5HLUnY/flash_images/fli-8pwc0OyFrOK/flash.webp`

### Price conversion
Prices are stored in cents as strings with commas (e.g. `"2,500"` = $25). Convert to dollars for display by dividing by 100 after removing commas.

### Data structure to generate (`src/data/artists.json`)

Group rows by artist handle. For each artist produce:

```json
{
  "handle": "444yatty",
  "location": "Denver, CO",
  "bookingUrl": "https://venue.ink/@444yatty",
  "priceRange": { "min": 100, "max": 420 },
  "flash": [
    {
      "id": "fli-8hq0xmky3Tk",
      "title": "Shin Chan",
      "description": "from the show: Crayon Shin Chan",
      "collection": "Anime",
      "imageUrl": "https://venue.ink/static/people/...",
      "priceMin": 100,
      "priceMax": 420
    }
  ]
}
```

---

## Step 2: Build the App

### Design Direction

Take strong visual cues from **venue.ink**:
- Dark theme — near-black background (`#0a0a0a`)
- Clean, editorial, bold typography (Inter or similar)
- Warm accent colors — use venue.ink's ink-drop logo colors as reference
- Venue's playful-but-premium feel — not corporate, not generic
- Smooth spring animations (Framer Motion)
- Mobile-first: 390px base width (iPhone 14 Pro), scales up gracefully

---

## Screens (4 total)

---

### Screen 1: Welcome / Onboarding

Take strong design cues from the venue.ink homepage:
- Bold headline, minimal chrome
- Venue logo / wordmark at top
- Tagline: *"Find your next tattoo."*
- Single CTA button: **"Find artists near me"** — styled like venue.ink's CTAs
- On click: request browser geolocation
- On grant: go to swipe screen
- On deny: show a simple city/zip text input as fallback
- Feel editorial and confident — reference venue.ink's hero section aesthetic

---

### Screen 2: Swipe Screen

This is the core experience. Model the engagement pattern closely after Tinder.

**Card Stack:**
- Stack of cards, top card is active and interactive
- Each card shows a single flash image — **full-bleed, no cropping, properly fitted** using `object-fit: contain` on a dark background so images display at their natural ratio without stretching
- Subtle card stack effect visible behind active card (2 cards peeking behind)

**Card overlay (minimal — let the art breathe):**
- Bottom gradient fade with:
  - Artist handle (e.g. `@444yatty`)
  - Flash title + collection tag (e.g. "Shin Chan · Anime")
  - Price range (e.g. "$100–$420")
  - Location (e.g. "Denver, CO")

**Swipe up — Detail peek (like Tinder's profile expand):**
- User can swipe up or tap a small chevron ↑ to reveal a partial bottom sheet
- Bottom sheet shows:
  - Full flash description
  - Collection name
  - Price breakdown (XS and XL sizes)
  - Artist handle + link to their full Venue page
- Swipe down or tap to dismiss

**Swipe Mechanics:**
- Swipe right or tap ❤️ = Like
- Swipe left or tap ✕ = Pass
- Like: card flies right with green heart overlay
- Pass: card flies left with red X overlay
- Drag rotation: card tilts naturally as dragged (like Tinder)
- Like/Pass indicator appears as user drags (green LIKE stamp, red NOPE stamp)

**Card sequencing (smart feed):**
- Start by showing flash images in random order across all artists
- Track likes per artist. As soon as a user likes any piece from an artist, begin inserting more of that artist's flash into the upcoming queue (weighted toward liked artists)
- This lets the app detect consistent taste

**Bottom action bar:**
- ✕ (pass) on left, ❤️ (like) on right
- Small "Liked" pill button top-right showing count badge

**Empty state:**
- "You've seen it all 🖤" with a soft reload option

---

### Screen 3: Liked Artists List

- Accessed from "Liked" button on swipe screen
- **Ranked by number of likes** — artist with most liked pieces appears first
- Each artist row/card shows:
  - Their most-liked flash image as thumbnail
  - Handle + location
  - **Like count** (e.g. "❤️ 4 pieces liked")
  - Expandable section showing the specific flash pieces they liked (nested, tap to expand)
  - "Book" button → opens Screen 4
- Back button to return to swipe screen

---

### Screen 4: Embedded Venue Booking

- Full-screen iframe of `https://venue.ink/@{handle}`
- Minimal header bar: back button + artist handle
- No other chrome — Venue takes over the screen

---

## Image Display Rules

- Never stretch or distort images
- Use `object-fit: contain` with a `#0a0a0a` background so portrait, landscape, and square images all display correctly
- Cards should have a fixed aspect ratio (e.g. 3:4) and images fit within that container naturally
- Lazy load images and preload the next 3 cards for smooth swiping

---

## Data & State Notes

- All data comes from `src/data/artists.json` (generated in Step 1 from the CSV)
- No backend — pure frontend prototype
- Keep all swipe state in React state (no persistence needed)
- Distance is mocked — assign a random realistic value (0.5–15 miles) per artist at load time, seeded so it doesn't change on re-render
