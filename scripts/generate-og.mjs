import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, 'og-template.html');
const outputPath = join(__dirname, '..', 'public', 'og-image.png');

// Ensure public dir exists
mkdirSync(join(__dirname, '..', 'public'), { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle0', timeout: 15000 });

// Wait for fonts
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 800));

await page.screenshot({
  path: outputPath,
  type: 'png',
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
console.log(`✓ OG image generated → public/og-image.png`);
