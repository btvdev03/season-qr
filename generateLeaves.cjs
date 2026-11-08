const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

function hexToRgb(hex) {
  const c = parseInt(hex.replace('#', ''), 16);
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

function sampleRamp(stops, t) {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (clamped >= s1.pos && clamped <= s2.pos) {
      const localT = (clamped - s1.pos) / (s2.pos - s1.pos);
      // smooth cubic easing
      const st = localT * localT * (3 - 2 * localT);
      const c1 = hexToRgb(s1.color);
      const c2 = hexToRgb(s2.color);
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * st),
        Math.round(c1[1] + (c2[1] - c1[1]) * st),
        Math.round(c1[2] + (c2[2] - c1[2]) * st)
      ];
    }
  }
  return hexToRgb(stops[stops.length - 1].color);
}

const RAMPS = {
  summer: [
    { pos: 0.0, color: '#0b2912' }, // Deep occlusion green shadow
    { pos: 0.25, color: '#145a27' }, // Rich forest emerald
    { pos: 0.55, color: '#1ea844' }, // Lush vibrant alive oak
    { pos: 0.8, color: '#3cd070' }, // Sunlit fresh canopy
    { pos: 1.0, color: '#86efac' }  // Luminous leaf crest highlight
  ],
  spring: [
    { pos: 0.0, color: '#9f1239' }, // Warm rose shadow
    { pos: 0.2, color: '#f43f5e' }, // Vivid blossom rose
    { pos: 0.45, color: '#f472b6' }, // True Sakura cherry blossom pink
    { pos: 0.72, color: '#fbcfe8' }, // Soft delicate petal
    { pos: 1.0, color: '#fff5f8' }  // Pure white blossom tip
  ],
  autumn: [
    { pos: 0.0, color: '#3d0a0a' }, // Deep mahogany shadow
    { pos: 0.26, color: '#b91c1c' }, // Kyoto crimson maple
    { pos: 0.52, color: '#ea580c' }, // Fiery glowing orange
    { pos: 0.78, color: '#f59e0b' }, // Golden amber foliage
    { pos: 1.0, color: '#fde047' }  // Sunlit honey gold
  ],
  winter: [
    { pos: 0.0, color: '#091526' }, // Deep alpine midnight shadow
    { pos: 0.25, color: '#1e3a5f' }, // Frost pine slate
    { pos: 0.55, color: '#0284c7' }, // Crisp glacier blue
    { pos: 0.8, color: '#7dd3fc' }, // Bright frost ice
    { pos: 1.0, color: '#ffffff' }  // Pure powdery snow
  ]
};

const leafDir = path.join(__dirname, 'public', 'assets', 'leaves');
const baseBuf = fs.readFileSync(path.join(leafDir, 'oak_color.png'));
const pltePos = baseBuf.indexOf(Buffer.from('PLTE'));

const Ls = [];
for (let i = 0; i < 768; i += 3) {
  const r = baseBuf[pltePos + 4 + i];
  const g = baseBuf[pltePos + 4 + i + 1];
  const b = baseBuf[pltePos + 4 + i + 2];
  Ls.push(0.299 * r + 0.587 * g + 0.114 * b);
}
const minL = Math.min(...Ls);
const maxL = Math.max(...Ls);

for (const [season, ramp] of Object.entries(RAMPS)) {
  const copy = Buffer.from(baseBuf);
  const newPlte = Buffer.alloc(768);
  for (let i = 0; i < 256; i++) {
    const origL = Ls[i];
    const t = (origL - minL) / (maxL - minL);
    const [nr, ng, nb] = sampleRamp(ramp, t);
    newPlte[i * 3] = nr;
    newPlte[i * 3 + 1] = ng;
    newPlte[i * 3 + 2] = nb;
  }
  newPlte.copy(copy, pltePos + 4);

  // CRC32 for chunk
  const crcData = Buffer.concat([Buffer.from('PLTE'), newPlte]);
  const newCrc = crc32(crcData);
  copy.writeUInt32BE(newCrc, pltePos + 4 + 768);

  const outPath = path.join(leafDir, `oak_${season}.png`);
  fs.writeFileSync(outPath, copy);
  console.log(`Generated ${outPath}`);
}
