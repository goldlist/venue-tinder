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

// Geocode a text query via Nominatim → { lat, lng, label }
export async function geocodeText(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VenueDiscover/1.0' }
  })
  const data = await res.json()
  if (!data || !data[0]) return null
  const d = data[0]
  // Build a readable label: "City, State" or display_name trimmed
  const parts = d.display_name.split(',').map(s => s.trim())
  const label = parts.slice(0, 2).join(', ')
  return { lat: parseFloat(d.lat), lng: parseFloat(d.lon), label }
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
      bookingUrl: artist.bookingUrl,
      priceRange: artist.priceRange,
    }))
  )
}
