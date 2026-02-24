# Claude Code Prompt v3: Tattoo Artist Discovery App (Tinder-style)

## Project Overview

Build a standalone mobile-first React web app (Vite + Tailwind + Framer Motion) called **"Discover by Venue"** — a Tinder-style tattoo flash discovery experience that feeds into the Venue booking platform.

---

## Step 1: Process the Data

The file `data/flash_data.csv` contains all artist and flash data. Process it into `src/data/artists.json`.

### Image URL conversion
Replace `s3://venue-ink-prd-app/` with `https://venue.ink/` on all image URLs.

### Price conversion
Prices are in cents as comma-strings (e.g. `"2,500"` = $25). Strip commas, parse as int, divide by 100.

### Location parsing
Each artist has a location string (e.g. `"Denver, CO"`, `"Toronto, CA"`). Parse city and region. Use these for distance calculation.

### Distance calculation
- On app load, get user's coordinates (from geolocation or entered location)
- Geocode each artist's location string to lat/lng using a free geocoding API (e.g. `https://nominatim.openstreetmap.org/search?q={location}&format=json`)
- Calculate real distance in miles (haversine formula) from user to each artist
- Sort feed: artists within 50 miles appear first, then by distance ascending, then remainder randomly
- Artists with no location get distance shown as "Location TBD"

### Data structure (`src/data/artists.json`)

```json
[
  {
    "handle": "444yatty",
    "location": "Denver, CO",
    "lat": 39.7392,
    "lng": -104.9903,
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
]
```

---

## Step 2: Build the App

---

## Design System — Venue Brand

Mirror the **venue.ink** visual identity precisely:

**Colors:**
- Background: `#0a0a0a` (near-black)
- Surface/card: `#111111`
- Primary text: `#FFFFFF`
- Secondary text: `#888888`
- Accent / CTA: `#F5F0E8` (warm off-white / cream — matches Venue's CTA buttons)
- Like green: `#4ade80`
- Pass red: `#f87171`
- Border/divider: `#222222`

**Typography:**
- Font: Inter (import from Google Fonts)
- Headlines: Bold, tight tracking, large — like Venue's "Tattoo booking that's as smooth as your lines"
- Body: Regular weight, generous line height
- Labels/tags: Uppercase, small, tracked out

**Visual language:**
- Minimal chrome, let content breathe
- Rounded corners on cards (`border-radius: 16px`)
- Subtle shadows
- Venue uses playful, editorial energy — not clinical, not corporate
- CTAs are cream/off-white pills with dark text (not colorful buttons)

---

## Screens (4 total)

---

### Screen 1: Welcome / Onboarding

Closely mirror venue.ink's homepage hero aesthetic:

**Layout:**
- Full screen, dark background
- Venue logo/wordmark at top center (use text "venue" in bold if SVG unavailable)
- Big bold headline: `"Find your next tattoo."`
- Subline: `"Discover flash from artists near you."`
- Single CTA pill button: `"Find artists near me"` — cream background, dark text, rounded pill

**Location flow:**
- On CTA click: request browser geolocation
- Show a subtle loading state while locating
- On success: show confirmed location with a small edit button — e.g. `"📍 Toronto, ON  ✎"` — then proceed to swipe screen
- On deny or error: show a text input — `"Enter your city or zip code"` — with a `"Search"` button
- On manual entry: geocode the input using Nominatim, confirm location, then proceed

**Design notes:**
- No navigation, no distractions
- Feels like opening a Venue booking page — premium, editorial, tattooed-person energy

---

### Screen 2: Swipe Screen

Core experience. Closely follow Tinder's engagement model.

**Header bar (top):**
- Left: Venue wordmark (small)
- Center: Location pill — e.g. `"📍 Toronto, ON"` — tappable to change location
- Right: `"Liked ❤️ 4"` pill button — tappable to go to Screen 3

**Card stack:**
- Full-height cards (fill screen minus header and action bar)
- 2 cards peek behind the active card (scale down slightly, slight y-offset)
- Active card is draggable

**Card image:**
- `object-fit: contain` inside the card with `#111111` background
- Never stretch, never crop — image sits naturally in the card
- Preload next 3 cards silently

**Card info overlay (bottom of card):**
- Gradient fade from transparent to `#0a0a0a` at bottom
- Artist handle (e.g. `@444yatty`) — bold, white
- Flash title · Collection tag (e.g. `"Shin Chan · Anime"`) — small, secondary
- Price range (e.g. `"$100 – $420"`) — cream accent color
- Distance (e.g. `"2.3 miles away"` or `"Denver, CO · 847 miles"`) — small, secondary

**Swipe gestures:**
- Drag left/right: card tilts naturally (rotation proportional to drag distance)
- As dragging right: large green `"LIKE"` stamp appears on card (rotated, Tinder-style)
- As dragging left: large red `"NOPE"` stamp appears
- Release past threshold: card flies off in that direction
- Release before threshold: card snaps back with spring physics

**Swipe up — detail sheet (Tinder profile expand):**
- Small `"↑ More"` label at bottom center of card
- Swipe up on card (or tap label): spring-animated bottom sheet slides up, covering ~60% of screen
- Sheet contains:
  - Flash image (smaller, top of sheet)
  - Full title + description
  - Collection name
  - Price: XS `$XX` / XL `$XX`
  - Artist handle as tappable link → opens their Venue page
  - Location + distance
- Swipe down or tap backdrop to dismiss

**Action bar (below card):**
- Two buttons, centered, below the card — NOT overlapping it
- `✕` button (left): outlined circle, subtle — triggers pass animation
- `❤️` button (right): outlined circle, subtle — triggers like animation
- Buttons are secondary to gesture — small enough not to dominate
- Designed for first-time users who haven't discovered swiping yet

**Smart card feed:**
- Initial queue: all flash items shuffled randomly across all artists
- Feed is sorted: local artists (within 50 miles) first, then by distance
- When user likes a flash item from artist X: insert 2 more of artist X's unseen flash into the next ~10 cards in the queue
- This surfaces whether the user consistently likes that artist's style

**Empty state:**
- `"You've seen it all 🖤"` centered, with a small `"Start over"` text link

---

### Screen 3: Liked Artists List

**Layout:**
- Full screen, dark
- Header: back arrow + `"Liked"` title
- Artists ranked by number of liked flash pieces (most liked → top)

**Each artist row:**
- Thumbnail: their most-liked flash image (square, rounded)
- Handle + location
- `"❤️ 4 pieces liked"` — like count
- `"Book →"` pill button — cream, opens Screen 4
- Tap row to expand: reveals a horizontal scroll of the specific flash pieces they liked (small thumbnails)

---

### Screen 4: Embedded Venue Booking

- Full-screen iframe: `https://venue.ink/@{handle}`
- Minimal top bar: `"← Back"` + artist handle
- No other chrome

---

## Location Change Flow

Accessible from the location pill in the swipe screen header:

- Tapping the pill opens a small modal/sheet
- Shows current detected location
- Text input to enter a new city or zip
- `"Use my location"` button to re-detect via GPS
- On change: re-calculate all distances, re-sort feed, show `"Showing artists near [New City]"`

---

## Image & Performance Rules

- `object-fit: contain` always — no stretching
- Dark `#111111` background behind all images
- Preload next 3 card images on mount
- Lazy load all others
- Handle broken image URLs gracefully (show a dark placeholder with artist handle)

---

## State & Data Notes

- All data from `src/data/artists.json`
- No backend needed — pure frontend prototype
- All state in React (useState/useReducer)
- No persistence required between sessions
