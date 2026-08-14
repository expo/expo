/**
 * Rasterize official MSTRMND tetrahedron mark for splash / icons.
 * Run: node scripts/generate-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(__dirname, '..', 'assets');

function markSvg(size, bg = 'transparent') {
  const stroke = Math.max(6, size * 0.045);
  const cx = size / 2;
  const cy = size / 2 + size * 0.02;
  const r = size * 0.36;
  const top = `${cx},${cy - r}`;
  const bl = `${cx - r * 0.866},${cy + r * 0.5}`;
  const br = `${cx + r * 0.866},${cy + r * 0.5}`;
  const mid = `${cx},${cy + size * 0.02}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#D4D8DE"/>
      <stop offset="100%" stop-color="#8A9098"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${size * 0.02}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <g filter="url(#glow)" fill="none" stroke="url(#chrome)" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="${top} ${br} ${bl}"/>
    <line x1="${top.split(',')[0]}" y1="${top.split(',')[1]}" x2="${mid.split(',')[0]}" y2="${mid.split(',')[1]}"/>
    <line x1="${bl.split(',')[0]}" y1="${bl.split(',')[1]}" x2="${mid.split(',')[0]}" y2="${mid.split(',')[1]}"/>
    <line x1="${br.split(',')[0]}" y1="${br.split(',')[1]}" x2="${mid.split(',')[0]}" y2="${mid.split(',')[1]}"/>
  </g>
</svg>`;
}

async function writePng(name, size, bg) {
  const buf = await sharp(Buffer.from(markSvg(size, bg))).png().toBuffer();
  const out = path.join(assets, name);
  fs.writeFileSync(out, buf);
  console.log('wrote', out, buf.length);
}

await writePng('splash-icon.png', 512, '#000000');
await writePng('icon.png', 1024, '#000000');
await writePng('favicon.png', 48, '#000000');
await writePng('android-icon-foreground.png', 432, 'transparent');
await writePng('brand-mark.png', 512, 'transparent');
await writePng('brand-mark-dark.png', 512, '#000000');

// adaptive background solid black
await sharp({
  create: { width: 432, height: 432, channels: 3, background: '#000000' },
})
  .png()
  .toFile(path.join(assets, 'android-icon-background.png'));

console.log('brand assets ready');
