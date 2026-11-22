// Generates the favicon set and the social share image into public/.
// Run with `npm run make-icons`; the outputs are committed, so this only
// needs re-running when the mark, name or headline changes.
//
// The mark is a 3x3 contribution grid, the same greens as the timeline.

import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { intro } from '../src/data/site.ts';

const github = JSON.parse(await readFile(new URL('../src/data/github.json', import.meta.url)));
const name = github.profile.name ?? github.profile.login;
const out = (file) => new URL(`../public/${file}`, import.meta.url);

const BG = '#0d1117';
const TEXT = '#e6edf3';
const MUTED = '#8b949e';
const LEVELS = ['#151b23', '#033a16', '#196c2e', '#2ea043', '#56d364'];

// Cell levels for the mark, row by row.
const MARK = [
  [1, 3, 2],
  [3, 4, 3],
  [2, 3, 1],
];

function grid(rows, { x, y, size, gap, radius }) {
  return rows
    .flatMap((row, r) =>
      row.map(
        (level, c) =>
          `<rect x="${x + c * (size + gap)}" y="${y + r * (size + gap)}" width="${size}" height="${size}" rx="${radius}" fill="${LEVELS[level]}"/>`,
      ),
    )
    .join('');
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${BG}"/>
${grid(MARK, { x: 10, y: 10, size: 13.33, gap: 2.5, radius: 3 })}
</svg>
`;

// ICO container holding PNG images (supported everywhere that matters).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

const render = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

await writeFile(out('favicon.svg'), faviconSvg);
await writeFile(
  out('favicon.ico'),
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await render(faviconSvg, size) })))),
);
// iOS applies its own corner mask, so fill the corners instead of leaving them transparent.
await writeFile(
  out('apple-touch-icon.png'),
  await sharp(await render(faviconSvg, 180)).flatten({ background: BG }).png().toBuffer(),
);

// --- Share image, 1200x630 -------------------------------------------------

const escapeXml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  return [...lines, line];
}

// Decorative contribution grid, deterministic so the image is reproducible.
const COLS = 9;
const ROWS = 7;
const field = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => {
    const n = Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233) * 43758.5453;
    const v = n - Math.floor(n);
    return v < 0.3 ? 0 : v < 0.5 ? 1 : v < 0.7 ? 2 : v < 0.88 ? 3 : 4;
  }),
);

const headline = wrap(intro.headline, 30)
  .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 64}">${escapeXml(line)}</tspan>`)
  .join('');

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${BG}"/>
<g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
  <text x="80" y="150" font-size="34" fill="${MUTED}">Projects</text>
  <text x="80" y="250" font-size="96" font-weight="700" fill="${TEXT}">${escapeXml(name)}</text>
  <text x="80" y="340" font-size="46" fill="${TEXT}">${headline}</text>
  <text x="80" y="560" font-size="32" fill="${MUTED}">cypherkunp.github.io</text>
</g>
${grid(field, { x: 742, y: 296, size: 34, gap: 8, radius: 6 })}
</svg>
`;

await sharp(Buffer.from(ogSvg)).png().toFile(new URL('../public/og.png', import.meta.url).pathname);

console.log('Wrote favicon.svg, favicon.ico, apple-touch-icon.png, og.png');
