import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HANDLES = [
  'girlknewyork',
  'harperzimmerink',
  'derrickdelarosa',
  'tattoosbymugs',
  'dark.forest.ink',
  'shimmerxsmoke',
  'rooted.ink',
  'dainty',
  'thetattoogemologist',
  'blackstatictattoos',
  'elm.jpeg',
  'mehanatattoo',
  'tay.branded',
  'babeethereal',
  'bloodletart',
  'drasticcrystal',
  'ink.by.jjennah',
  'onkentattoo',
  'atlantatoos',
  'silfiravonsartistry',
  'gracehardytattoos',
  'lexiestatoos',
  'delicatepointofink',
  'ember.inks',
  'sombra.y.miel.tattoo',
  'jayemtattoo',
  'buyanisles',
  'sebastattooing',
  'madisonmayink',
  'tinytatclub',
  'signatureink.chelsea',
  'livinktatoo',
  'adamserati',
  'ink',
  'goodgirlvyink',
  'layryesitatatoos',
  'leila.oko',
  'envisiontattoo',
  'amandaa.artistry',
  'inkedbyniyy',
  'jadesacredink',
  'tattoosbykayla',
  'latintadelo',
  'lazengertattoo',
  'downtowninkk',
  'barelyshaded',
  'jaynawon',
  'ruebeetattoos',
  'inked.by.lulu',
  'ayasha.luna',
]

function randomDistance() {
  return Math.round((Math.random() * 14.5 + 0.5) * 10) / 10
}

async function scrapeArtist(page, handle) {
  const url = `https://venue.ink/@${handle}/flash`
  console.log(`Scraping: ${url}`)
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })

    const data = await page.evaluate(() => {
      // Profile image — venue.ink uses alt="Artist Avatar"
      const profileImg =
        document.querySelector('img[alt="Artist Avatar"]')?.src ||
        document.querySelector('img[alt*="Avatar"]')?.src ||
        document.querySelector('img[alt*="profile"]')?.src ||
        document.querySelector('img[class*="avatar"]')?.src ||
        document.querySelector('img[class*="rounded-full"]')?.src ||
        null

      // Bio
      const bio =
        document.querySelector('[class*="bio"]')?.innerText?.trim() ||
        document.querySelector('p[class*="about"]')?.innerText?.trim() ||
        document.querySelector('meta[name="description"]')?.content ||
        null

      // Location
      const locationEl =
        document.querySelector('[class*="location"]') ||
        document.querySelector('[data-testid*="location"]') ||
        null
      const location = locationEl?.innerText?.trim() || null

      // Style tags
      const tagEls = Array.from(
        document.querySelectorAll('[class*="tag"], [class*="style"], [class*="badge"]')
      )
      const styles = tagEls
        .map(el => el.innerText?.trim().toLowerCase())
        .filter(t => t && t.length < 30 && t.length > 0)
        .slice(0, 6)

      // Flash images — venue.ink uses /static/people/.../flash_images/ or /flash_image_collections/
      const imgEls = Array.from(document.querySelectorAll('img'))
      const flashImages = imgEls
        .map(img => img.src)
        .filter(src =>
          src &&
          src.startsWith('http') &&
          (
            src.includes('/flash_images/') ||
            src.includes('/flash_image_collections/') ||
            (
              src.includes('/static/people/') &&
              !src.includes('profile_image') &&
              !src.includes('no-profile')
            )
          )
        )
        .slice(0, 6)

      return { profileImg, bio, location, styles, flashImages }
    })

    // Always get the profile image from the main artist page
    let profileImage = null
    try {
      await page.goto(`https://venue.ink/@${handle}`, { waitUntil: 'networkidle2', timeout: 15000 })
      profileImage = await page.evaluate(() => {
        return (
          document.querySelector('img[alt="Artist Avatar"]')?.src ||
          document.querySelector('img[alt*="Avatar"]')?.src ||
          document.querySelector('img[alt*="profile"]')?.src ||
          document.querySelector('img[class*="rounded-full"]')?.src ||
          null
        )
      })
    } catch (e) {}
    profileImage = profileImage || data.profileImg || null

    return {
      handle,
      profileImage: profileImage || null,
      flashImages: data.flashImages,
      styles: data.styles,
      location: data.location,
      bio: data.bio,
      distance: randomDistance(),
      bookingUrl: `https://venue.ink/@${handle}`,
    }
  } catch (err) {
    console.error(`  Failed for @${handle}: ${err.message}`)
    return null
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  )

  const artists = []

  for (const handle of HANDLES) {
    const result = await scrapeArtist(page, handle)
    if (result) {
      artists.push(result)
      console.log(`  ✓ @${handle} — ${result.flashImages.length} flash images`)
    } else {
      console.log(`  ✗ @${handle} — skipped`)
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 800))
  }

  await browser.close()

  const outDir = join(__dirname, '../src/data')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'artists.json')
  writeFileSync(outPath, JSON.stringify(artists, null, 2))

  console.log(`\nDone! Saved ${artists.length} artists to ${outPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
