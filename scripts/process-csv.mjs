import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '../data/flash_data.csv')
const outputPath = path.join(__dirname, '../src/data/artists.json')
const cachePath = path.join(__dirname, '../data/geocode-cache.json')

// Load geocode cache
let geocodeCache = {}
if (fs.existsSync(cachePath)) {
  geocodeCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
  console.log(`Loaded ${Object.keys(geocodeCache).length} cached geocodes`)
}

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

async function geocodeLocation(location) {
  if (!location || location.length < 2) return null
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VenueDiscover/1.0 (tattoo artist discovery app)' }
    })
    const data = await res.json()
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (e) {
    console.error(`Geocode failed for "${location}":`, e.message)
  }
  return null
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
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

  const location = cols[1]
  const title = cols[2]
  const description = cols[3]
  const rawUrl = cols[4]
  const collection = cols[5] || ''
  const xsCents = parseInt((cols[6] || '0').replace(/,/g, '')) || 0
  const xlCents = parseInt((cols[7] || '0').replace(/,/g, '')) || 0

  if (!rawUrl || !rawUrl.startsWith('s3://')) continue

  const imageUrl = rawUrl.replace('s3://venue-ink-prd-app/', 'https://venue.ink/')
  const flashIdMatch = imageUrl.match(/\/(fli-[A-Za-z0-9]+)\//)
  const flashId = flashIdMatch ? flashIdMatch[1] : `fli-line${lineNum}`

  if (seenFlashIds.has(flashId)) continue
  seenFlashIds.add(flashId)

  const priceMin = xsCents > 0 ? Math.round(xsCents / 100) : 0
  const priceMax = xlCents > 0 ? Math.round(xlCents / 100) : priceMin

  if (!artistMap.has(handle)) {
    artistMap.set(handle, { handle, location, bookingUrl: `https://venue.ink/@${handle}`, flash: [] })
  }

  artistMap.get(handle).flash.push({ id: flashId, title, description, collection, imageUrl, priceMin, priceMax })
}

// Collect unique locations to geocode
const uniqueLocations = [...new Set([...artistMap.values()].map(a => a.location).filter(Boolean))]
const toGeocode = uniqueLocations.filter(loc => !(loc in geocodeCache))
console.log(`Need to geocode ${toGeocode.length} new locations (${uniqueLocations.length - toGeocode.length} cached)`)

// Geocode uncached locations
for (let i = 0; i < toGeocode.length; i++) {
  const loc = toGeocode[i]
  process.stdout.write(`[${i + 1}/${toGeocode.length}] Geocoding: ${loc} ... `)
  const coords = await geocodeLocation(loc)
  geocodeCache[loc] = coords
  // Save cache after each result
  fs.writeFileSync(cachePath, JSON.stringify(geocodeCache, null, 2))
  console.log(coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'not found')
  if (i < toGeocode.length - 1) await sleep(1100) // Nominatim: 1 req/sec
}

// Build final artists array with geocoords
const artists = Array.from(artistMap.values()).map(artist => {
  const prices = artist.flash.flatMap(f => [f.priceMin, f.priceMax]).filter(p => p > 0)
  const priceRange = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 }
  const coords = geocodeCache[artist.location] || null
  return {
    handle: artist.handle,
    location: artist.location,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    bookingUrl: artist.bookingUrl,
    priceRange,
    flash: artist.flash,
  }
}).filter(a => a.flash.length > 0)

fs.writeFileSync(outputPath, JSON.stringify(artists, null, 2))
console.log(`\n✓ ${artists.length} artists, ${artists.reduce((s, a) => s + a.flash.length, 0)} flash items written to src/data/artists.json`)
console.log(`  ${artists.filter(a => a.lat !== null).length} artists geocoded`)
