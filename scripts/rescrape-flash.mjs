/**
 * Re-scrapes flash images for artists that currently have none.
 * Uses a more patient strategy: wait for actual image elements.
 */
import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPath = join(__dirname, '../src/data/artists.json')
const artists = JSON.parse(readFileSync(dataPath, 'utf8'))

async function scrapeFlashImages(page, handle) {
  const url = `https://venue.ink/@${handle}/flash`
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 })
    // Scroll to trigger lazy loading
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 300)
        await new Promise(r => setTimeout(r, 300))
      }
      window.scrollTo(0, 0)
    })
    await new Promise(r => setTimeout(r, 1500))

    return await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs
        .map(img => img.src || img.currentSrc)
        .filter(src =>
          src &&
          src.startsWith('http') &&
          src.includes('/static/people/') &&
          !src.includes('profile_image') &&
          !src.includes('no-profile') &&
          !src.includes('assets/')
        )
        .slice(0, 6)
    })
  } catch (e) {
    console.error(`  Error for @${handle}: ${e.message}`)
    return []
  }
}

async function main() {
  const missing = artists.filter(a => a.flashImages.length === 0)
  console.log(`Re-scraping ${missing.length} artists with no flash images...`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  )

  let improved = 0
  for (const artist of missing) {
    const flash = await scrapeFlashImages(page, artist.handle)
    if (flash.length > 0) {
      artist.flashImages = flash
      improved++
      console.log(`  ✓ @${artist.handle} — ${flash.length} flash images`)
    } else {
      console.log(`  — @${artist.handle} — still none`)
    }
    await new Promise(r => setTimeout(r, 600))
  }

  await browser.close()

  writeFileSync(dataPath, JSON.stringify(artists, null, 2))
  console.log(`\nDone! Improved ${improved}/${missing.length} artists.`)
}

main().catch(e => { console.error(e); process.exit(1) })
