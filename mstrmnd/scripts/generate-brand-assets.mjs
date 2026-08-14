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

function markSvg(size, bg = 'transparent', strokeScale = 0.064) {
  const stroke = Math.max(6, size * strokeScale);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.35;
  const topX = cx;
  const topY = cy - R;
  const blX = cx - R * 0.8660254;
  const blY = cy + R * 0.5;
  const brX = cx + R * 0.8660254;
  const brY = cy + R * 0.5;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="chrome" x1="15%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="42%" stop-color="#D2D6DC"/>
      <stop offset="100%" stop-color="#8B919A"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${size * 0.016}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <g filter="url(#glow)" fill="none" stroke="url(#chrome)" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="${topX},${topY} ${brX},${brY} ${blX},${blY}"/>
    <line x1="${topX}" y1="${topY}" x2="${cx}" y2="${cy}"/>
    <line x1="${blX}" y1="${blY}" x2="${cx}" y2="${cy}"/>
    <line x1="${brX}" y1="${brY}" x2="${cx}" y2="${cy}"/>
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

await sharp({
  create: { width: 432, height: 432, channels: 3, background: '#000000' },
})
  .png()
  .toFile(path.join(assets, 'android-icon-background.png'));

fs.copyFileSync(
  path.join(assets, 'brand-mark-dark.png'),
  path.join(assets, 'android-icon-monochrome.png'),
);

console.log('brand assets ready');
