import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const artistsPath = path.join(__dirname, '../src/data/artists.json')
const cachePath = path.join(__dirname, '../data/profile-image-cache.json')

const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf-8'))

let cache = {}
if (fs.existsSync(cachePath)) {
  cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
  console.log(`Loaded ${Object.keys(cache).length} cached profile images`)
}

const toFetch = artists.filter(a => !(a.handle in cache))
console.log(`Need to fetch ${toFetch.length} profile images\n`)

async function fetchProfileImage(handle) {
  const url = `https://venue.ink/@${handle}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Matches: "/static/people/per-xxx/profile_image.hash.ext"
    const match = html.match(/\/static\/people\/per-[A-Za-z0-9]+\/profile_image\.[^"'\s]+/)
    return match ? `https://venue.ink${match[0]}` : null
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// 5 concurrent requests
const BATCH = 5
for (let i = 0; i < toFetch.length; i += BATCH) {
  const batch = toFetch.slice(i, i + BATCH)
  const results = await Promise.all(batch.map(a => fetchProfileImage(a.handle)))
  batch.forEach((artist, j) => {
    cache[artist.handle] = results[j]
    console.log(`[${i + j + 1}/${toFetch.length}] @${artist.handle}: ${results[j] || 'not found'}`)
  })
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
  if (i + BATCH < toFetch.length) await sleep(300)
}

// Write updated artists.json
const updated = artists.map(a => ({
  ...a,
  profileImageUrl: cache[a.handle] || null,
}))
fs.writeFileSync(artistsPath, JSON.stringify(updated, null, 2))

const found = Object.values(cache).filter(Boolean).length
console.log(`\n✓ ${found}/${artists.length} artists have profile images`)
