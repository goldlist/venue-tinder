import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '../data/jason_s_flash_tinder_query_2026-02-26T13_35_12.838999581-05_00.csv')
const outputPath = path.join(__dirname, '../src/data/artists.json')

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

// Parse "40.96954000° N" -> 40.96954, "74.28526900° W" -> -74.285269
function parseCoord(str) {
  if (!str) return null
  const match = str.match(/([\d.]+)°?\s*([NSEW])/i)
  if (!match) return null
  const val = parseFloat(match[1])
  const dir = match[2].toUpperCase()
  return (dir === 'S' || dir === 'W') ? -val : val
}

const text = fs.readFileSync(csvPath, 'utf-8')
const rawLines = text.split('\n')

// Build artist map from CSV
const artistMap = new Map()
const seenFlashIds = new Set()

for (let lineNum = 1; lineNum < rawLines.length; lineNum++) {
  const line = rawLines[lineNum]
  if (!line.trim()) continue

  const cols = parseCSVLine(line)
  if (cols.length < 5) continue

  const handle = cols[0]
  if (!handle) continue

  const title = cols[2]
  const description = cols[3]
  const rawUrl = cols[4]
  const collection = cols[5] || ''
  // cols[6-10]: Is [XSmall/Small/Medium/Large/XLarge] Enabled
  // cols[11-15]: Duration minutes per size
  // cols[16-20]: Price in cents per size
  const SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL']
  const sizes = SIZE_LABELS.map((size, i) => {
    const enabled = (cols[6 + i] || '').toLowerCase() === 'true'
    const duration = parseInt(cols[11 + i]) || 0
    const priceCents = parseInt((cols[16 + i] || '0').replace(/,/g, '')) || 0
    if (!enabled || priceCents === 0) return null
    return { size, price: Math.round(priceCents / 100), duration }
  }).filter(Boolean)
  const sizePrices = sizes.map(s => s.price) // already in dollars
  const rawProfileUrl = cols[23] || ''
  const country = cols[24] || ''
  const locality = cols[25] || ''
  const lat = parseCoord(cols[26])
  const lng = parseCoord(cols[27])

  if (!rawUrl || !rawUrl.startsWith('s3://')) continue

  const imageUrl = rawUrl.replace('s3://venue-ink-prd-app/', 'https://venue.ink/')
  const flashIdMatch = imageUrl.match(/\/(fli-[A-Za-z0-9]+)\//)
  if (!flashIdMatch) continue  // skip old-format URLs missing /fli-XXX/ segment (no valid CDN path)
  const flashId = flashIdMatch[1]

  if (seenFlashIds.has(flashId)) continue
  seenFlashIds.add(flashId)

  const priceMin = sizePrices.length > 0 ? Math.min(...sizePrices) : 0
  const priceMax = sizePrices.length > 0 ? Math.max(...sizePrices) : priceMin

  if (!artistMap.has(handle)) {
    const profileImageUrl = rawProfileUrl.startsWith('s3://')
      ? rawProfileUrl.replace('s3://venue-ink-prd-app/', 'https://venue.ink/')
      : rawProfileUrl || null
    const location = [locality, country].filter(Boolean).join(', ')
    artistMap.set(handle, { handle, location, lat, lng, bookingUrl: `https://venue.ink/@${handle}`, profileImageUrl, flash: [] })
  }

  artistMap.get(handle).flash.push({ id: flashId, title, description, collection, imageUrl, priceMin, priceMax, sizes })
}

// Build final artists array
const artists = Array.from(artistMap.values()).map(artist => {
  const prices = artist.flash.flatMap(f => [f.priceMin, f.priceMax]).filter(p => p > 0)
  const priceRange = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 }
  return {
    handle: artist.handle,
    location: artist.location,
    lat: artist.lat,
    lng: artist.lng,
    bookingUrl: artist.bookingUrl,
    profileImageUrl: artist.profileImageUrl ?? null,
    priceRange,
    flash: artist.flash,
  }
}).filter(a => a.flash.length > 0)

fs.writeFileSync(outputPath, JSON.stringify(artists, null, 2))
console.log(`✓ ${artists.length} artists, ${artists.reduce((s, a) => s + a.flash.length, 0)} flash items written to src/data/artists.json`)
console.log(`  ${artists.filter(a => a.lat !== null).length} artists with coordinates`)
