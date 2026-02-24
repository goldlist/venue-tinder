import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
mkdirSync(join(publicDir, 'icons'), { recursive: true });

// Full-bleed icon HTML — no border radius so Apple applies its own squircle mask
const iconHtml = (size) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width: ${size}px; height: ${size}px;
  background: #171819;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
</style></head><body>
<svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M26.1161 20.6687C25.1953 18.9477 23.9927 16.9983 23.1383 15.3281C22.5729 14.0805 22.0632 12.9471 21.5588 11.6469C21.3183 10.9905 21.0849 10.2923 20.8516 9.63039C20.6434 9.14439 20.6685 8.8071 20.3418 8.497C20.157 8.35556 19.8913 8.34649 19.6975 8.47887C19.3672 8.73637 19.3564 9.18247 19.1931 9.54516C18.9346 10.2723 18.5326 11.5036 18.1862 12.3396C17.75 13.3443 17.3461 14.3199 16.8866 15.3064C16.3876 16.3092 15.7864 17.2975 15.2317 18.2949C13.9932 20.4619 12.6129 22.5329 12.9576 25.1986C13.6791 31.8683 22.2409 33.9882 25.9079 28.4283C27.4389 26.1651 27.4659 23.0533 26.1304 20.6977L26.1161 20.6687Z" fill="#E9FB29"/>
</svg>
</body></html>`;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const sizes = [
  { size: 180, path: join(publicDir, 'apple-touch-icon.png') },
  { size: 192, path: join(publicDir, 'icons', 'icon-192.png') },
  { size: 512, path: join(publicDir, 'icons', 'icon-512.png') },
];

for (const { size, path } of sizes) {
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(iconHtml(size), { waitUntil: 'networkidle0' });
  await page.screenshot({ path, type: 'png', clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log(`✓ ${size}x${size} → ${path.split('/public/')[1]}`);
}

await browser.close();
