# Claude Code Prompt: Tattoo Artist Discovery App (Tinder-style)

## Project Overview

Build a standalone mobile-first React web app called **"Discover"** — a Tinder-style tattoo artist discovery experience that feeds into the Venue booking platform.

---

## Tech Stack

- **React** (Vite)
- **Tailwind CSS**
- **Framer Motion** (swipe gestures + card animations)
- **Puppeteer** (for scraping artist data from Venue)

---

## Step 1: Scrape Artist Data

Before building the UI, use Puppeteer to scrape the following 50 Venue artist pages. For each artist, visit `https://venue.ink/@{handle}/flash` and collect:

- Handle
- Profile image URL
- Bio (if present)
- Style tags (if present)
- Location (if present)
- Up to 6 flash image URLs
- Their booking URL: `https://venue.ink/@{handle}`

### Artist Handles to Scrape:

1. @girlknewyork
2. @harperzimmerink
3. @derrickdelarosa
4. @tattoosbymugs
5. @dark.forest.ink
6. @shimmerxsmoke
7. @rooted.ink
8. @dainty
9. @thetattoogemologist
10. @blackstatictattoos
11. @elm.jpeg
12. @mehanatattoo
13. @tay.branded
14. @babeethereal
15. @bloodletart
16. @drasticcrystal
17. @ink.by.jjennah
18. @onkentattoo
19. @atlantatoos
20. @silfiravonsartistry
21. @gracehardytattoos
22. @lexiestatoos
23. @delicatepointofink
24. @ember.inks
25. @sombra.y.miel.tattoo
26. @jayemtattoo
27. @buyanisles
28. @sebastattooing
29. @madisonmayink
30. @tinytatclub
31. @signatureink.chelsea
32. @livinktatoo
33. @adamserati
34. @ink
35. @goodgirlvyink
36. @layryesitatatoos
37. @leila.oko
38. @envisiontattoo
39. @amandaa.artistry
40. @inkedbyniyy
41. @jadesacredink
42. @tattoosbykayla
43. @latintadelo
44. @lazengertattoo
45. @downtowninkk
46. @barelyshaded
47. @jaynawon
48. @ruebeetattoos
49. @inked.by.lulu
50. @ayasha.luna

Save the scraped data to `src/data/artists.json`. For any fields not found, use `null`. For style tags not explicitly listed, infer them from the flash image content/filenames if possible, otherwise leave as empty array.

---

## Step 2: Build the App

### Screens (4 total)

---

### Screen 1: Onboarding / Location Permission

- Full screen, centered layout
- App name + tagline: *"Find your next tattoo artist."*
- Single CTA button: **"Find artists near me"**
- On click: request browser geolocation permission
- On grant: proceed to Screen 2 (Swipe)
- On deny: show a city search input as fallback
- Design should feel editorial and bold — not clinical

---

### Screen 2: Swipe Screen

This is the core experience.

**Card Stack:**
- Show a stack of artist cards (top card is active)
- Each card shows:
  - A flash image from the artist (full-bleed, fills the card)
  - Artist handle overlaid at the bottom (e.g. `@girlknewyork`)
  - Style tags as small pills (e.g. `fine line`, `blackwork`)
  - Distance (mocked for now, e.g. "2.3 miles away")
- Cards cycle through each artist's flash images before moving to the next artist

**Swipe Mechanics:**
- Swipe right (or tap ❤️) = Like
- Swipe left (or tap ✕) = Pass
- On like: card animates off to the right with a green heart overlay
- On pass: card animates off to the left with a red X overlay
- Drag gesture should feel physical — card rotates slightly as dragged

**Bottom Bar:**
- ✕ button (pass) — left
- ❤️ button (like) — right
- Small "View Liked" button in the top right corner showing liked count badge

**When all cards are exhausted:**
- Show a "You've seen everyone nearby" empty state with a refresh option

---

### Screen 3: Liked Artists List

- Accessed via "View Liked" button on swipe screen
- Grid of liked artists (2 columns)
- Each tile shows:
  - Their best flash image
  - Handle
  - Style tags
  - "Book" button
- Tapping "Book" opens Screen 4
- Back button to return to swipe screen

---

### Screen 4: Embedded Venue Booking

- Full screen webview (iframe) of the artist's Venue page: `https://venue.ink/@{handle}`
- Header bar with back button and artist handle
- No other chrome — the Venue site takes over the full screen

---

## Design Direction

- **Dark theme** — near-black background (`#0a0a0a`)
- **Typography:** Bold, modern sans-serif (use Inter or similar)
- **Accent color:** Warm white or soft gold for CTAs
- **Card design:** Rounded corners, subtle drop shadow, full-bleed imagery
- **Feels like:** A premium editorial app, not a typical booking tool
- **Animations:** Smooth, springy (use Framer Motion spring physics)
- **Mobile-first:** Design for 390px width (iPhone 14 Pro), scales up gracefully

---

## Data Model (per artist)

```json
{
  "handle": "girlknewyork",
  "profileImage": "https://...",
  "flashImages": ["https://...", "https://..."],
  "styles": ["fine line", "botanical"],
  "location": "New York, NY",
  "bio": "...",
  "distance": 2.3,
  "bookingUrl": "https://venue.ink/@girlknewyork"
}
```

---

## Notes

- Distance is mocked for now — generate a realistic random value between 0.5–15 miles for each artist
- If scraping fails for an artist, skip them rather than using placeholder data
- The app should work fully offline after initial load (all data in `artists.json`)
- No backend required — this is a pure frontend prototype
- Keep the swipe state in React state (no persistence needed yet)
