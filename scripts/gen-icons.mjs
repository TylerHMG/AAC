// Rasterize public/icon.svg into the PNGs that home-screen install needs.
// Run with: node scripts/gen-icons.mjs  (after editing the SVG, re-run to refresh).
//
// iOS/Android apply their own rounded mask, so we flatten onto the teal brand
// colour to produce an opaque square — no transparent corners, no white box.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const svg = readFileSync(join(root, 'icon.svg'));
const BG = '#1f6f6b';

const targets = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg)
    .resize(size, size)
    .flatten({ background: BG })
    .png()
    .toFile(join(root, file));
  console.log(`wrote public/${file} (${size}x${size})`);
}
