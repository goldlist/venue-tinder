// Build a Venue flash URL — falls back to artist page for synthetic IDs
export function flashUrl(handle, flashId) {
  if (flashId && /^fli-[A-Za-z0-9]{8,}/.test(flashId)) {
    return `https://venue.ink/@${handle}/flash/${flashId}`
  }
  return `https://venue.ink/@${handle}`
}

// Haversine distance in miles
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Format distance for display
export function formatDistance(miles) {
  if (miles == null) return null
  if (miles < 0.1) return 'Here'
  if (miles < 10) return `${miles.toFixed(1)} mi away`
  return `${Math.round(miles)} mi away`
}

// Format a Nominatim result into a short readable label
function formatNominatimLabel(d) {
  const a = d.address || {}
  const name = a.city || a.town || a.village || a.municipality || a.county || d.name || ''
  if (a.country_code === 'us') {
    const state = a.state_code || a.state || ''
    return [name, state].filter(Boolean).join(', ')
  }
  const region = a.state || a.region || ''
  const country = a.country || ''
  return [name, region, country].filter(Boolean).join(', ') || d.display_name.split(',')[0]
}

// Geocode a text query via Nominatim → { lat, lng, label }
export async function geocodeText(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VenueDiscover/1.0' }
  })
  const data = await res.json()
  if (!data || !data[0]) return null
  const d = data[0]
  return { lat: parseFloat(d.lat), lng: parseFloat(d.lon), label: formatNominatimLabel(d) }
}

// Search for locations (autocomplete) → [{ lat, lng, label }]
export async function searchLocations(query, limit = 6) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VenueDiscover/1.0' }
  })
  const data = await res.json()
  if (!data) return []
  // Dedupe by label
  const seen = new Set()
  return data
    .map(d => ({ lat: parseFloat(d.lat), lng: parseFloat(d.lon), label: formatNominatimLabel(d) }))
    .filter(r => { if (!r.label || seen.has(r.label)) return false; seen.add(r.label); return true })
}

// Reverse geocode GPS coords → label string
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VenueDiscover/1.0' }
  })
  const data = await res.json()
  if (!data?.address) return `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  const a = data.address
  const city = a.city || a.town || a.village || a.county || ''
  const state = a.state_code || a.state || ''
  return [city, state].filter(Boolean).join(', ') || data.display_name.split(',')[0]
}

// Build distance-sorted flash feed from artists + user coords
export function buildFeed(artists, userLat, userLng) {
  const withDist = artists.map(artist => {
    const dist =
      artist.lat != null && artist.lng != null && userLat != null && userLng != null
        ? haversine(userLat, userLng, artist.lat, artist.lng)
        : null
    return { ...artist, computedDistance: dist }
  })

  // Sort: local (≤50 mi) by distance ASC, then rest randomly
  const local = withDist
    .filter(a => a.computedDistance != null && a.computedDistance <= 50)
    .sort((a, b) => a.computedDistance - b.computedDistance)

  const remote = withDist
    .filter(a => a.computedDistance == null || a.computedDistance > 50)
    .sort(() => Math.random() - 0.5)

  const sorted = [...local, ...remote]

  // Flatten to flash items
  return sorted.flatMap(artist =>
    artist.flash.map(f => ({
      ...f,
      artistHandle: artist.handle,
      artistLocation: artist.location,
      artistLat: artist.lat,
      artistLng: artist.lng,
      artistDistance: artist.computedDistance,
      artistProfileImageUrl: artist.profileImageUrl ?? null,
      bookingUrl: artist.bookingUrl,
      priceRange: artist.priceRange,
    }))
  )
}
