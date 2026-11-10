const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Canvas dimensions: We render internally at 1024x1024 (2x supersampling),
// then downsample to 512x512 for smooth anti-aliased transparency and crisp details.
const TARGET_SIZE = 512;
const SCALE = 2;
const W = TARGET_SIZE * SCALE; // 1024
const H = TARGET_SIZE * SCALE; // 1024

// Float buffer for RGBA (0.0 to 1.0)
const bufR = new Float32Array(W * H);
const bufG = new Float32Array(W * H);
const bufB = new Float32Array(W * H);
const bufA = new Float32Array(W * H);

// Utility: Hex color to [r, g, b] in [0, 1]
function hex(hexStr) {
  const c = parseInt(hexStr.replace('#', ''), 16);
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
}

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
}

function samplePalette(stops, t) {
  const cl = clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (cl >= s1.pos && cl <= s2.pos) {
      const localT = (cl - s1.pos) / (s2.pos - s1.pos);
      const st = localT * localT * (3 - 2 * localT);
      return lerpColor(hex(s1.color), hex(s2.color), st);
    }
  }
  return hex(stops[stops.length - 1].color);
}

// Alpha blend pixel at (x, y) with standard Porter-Duff source-over
function blendPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H || a <= 0.001) return;
  const idx = y * W + x;
  const da = bufA[idx];
  const outA = a + da * (1 - a);
  if (outA > 0) {
    bufR[idx] = (r * a + bufR[idx] * da * (1 - a)) / outA;
    bufG[idx] = (g * a + bufG[idx] * da * (1 - a)) / outA;
    bufB[idx] = (b * a + bufB[idx] * da * (1 - a)) / outA;
    bufA[idx] = outA;
  }
}

// Draw a filled disk with anti-aliasing
function drawDisk(cx, cy, radius, [r, g, b], alpha = 1.0) {
  const minX = Math.max(0, Math.floor(cx - radius - 1.5));
  const maxX = Math.min(W - 1, Math.ceil(cx + radius + 1.5));
  const minY = Math.max(0, Math.floor(cy - radius - 1.5));
  const maxY = Math.min(H - 1, Math.ceil(cy + radius + 1.5));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < radius + 1.5) {
        const edge = 1 - smoothstep(radius - 0.75, radius + 0.75, d);
        if (edge > 0) {
          blendPixel(x, y, r, g, b, alpha * edge);
        }
      }
    }
  }
}

// Draw smooth thick line segment from (x1, y1) to (x2, y2)
function drawSegment(x1, y1, x2, y2, r1, r2, color1, color2, alpha = 1.0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return;

  const maxR = Math.max(r1, r2) + 2.0;
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - maxR));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(x1, x2) + maxR));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - maxR));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y1, y2) + maxR));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = clamp(((x - x1) * dx + (y - y1) * dy) / lenSq, 0, 1);
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const d = Math.hypot(x - px, y - py);
      const curR = lerp(r1, r2, t);

      if (d < curR + 1.5) {
        const edge = 1 - smoothstep(curR - 0.75, curR + 0.75, d);
        if (edge > 0) {
          const col = lerpColor(color1, color2, t);
          blendPixel(x, y, col[0], col[1], col[2], alpha * edge);
        }
      }
    }
  }
}

// Draw smooth curve using cubic Bézier segments
function drawBezier(p0, p1, p2, p3, r0, r3, col0, col3, steps = 32) {
  let prevPt = p0;
  let prevR = r0;
  let prevCol = col0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
    const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
    const r = lerp(r0, r3, t);
    const col = lerpColor(col0, col3, t);

    drawSegment(prevPt.x, prevPt.y, x, y, prevR, r, prevCol, col);
    prevPt = { x, y };
    prevR = r;
    prevCol = col;
  }
}

// =========================================================================
// BOTANICAL ELEMENT RENDERERS
// =========================================================================

/**
 * Renders an authentic 5-petal Mai Vang flower petal
 * @param {number} cx Center X of flower
 * @param {number} cy Center Y of flower
 * @param {number} angle Angle of petal axis in radians
 * @param {number} length Petal length from center to tip
 * @param {number} width Maximum petal width across
 * @param {object} opt Options (seed, curl)
 */
function drawMaiPetal(cx, cy, angle, length, width, _opt = {}) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  // Unit vectors: dir along petal length, perp perpendicular
  const dx = cosA;
  const dy = sinA;
  const px = -sinA;
  const py = cosA;

  // Lobe center and radius
  const yc = length * 0.64;
  const Ry = length * 0.38;
  const Rx = width * 0.50;

  // Bounding box in world coordinates
  const radius = length * 1.08;
  const minX = Math.max(0, Math.floor(cx - radius - 2));
  const maxX = Math.min(W - 1, Math.ceil(cx + radius + 2));
  const minY = Math.max(0, Math.floor(cy - radius - 2));
  const maxY = Math.min(H - 1, Math.ceil(cy + radius + 2));

  // Authentic Mai Vang color gradient ramp:
  // Base: Warm amber honey #b45309 / #d97706
  // Mid: Rich royal Mai yellow #eab308
  // Body: Radiant sunny golden blossom #facc15
  // Edge/Tip: Luminous warm ivory-gold highlight #fde047 / #fef9c3
  const petalRamp = [
    { pos: 0.00, color: '#b45309' }, // Honey amber base
    { pos: 0.12, color: '#d97706' }, // Warm golden orange
    { pos: 0.28, color: '#eab308' }, // True royal Mai yellow
    { pos: 0.55, color: '#facc15' }, // Radiant golden blossom
    { pos: 0.85, color: '#fde047' }, // Sunny blooming petal
    { pos: 1.00, color: '#fef9c3' }  // Luminous sunlit rim
  ];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const rx = x - cx;
      const ry = y - cy;

      // Project onto petal local frame:
      // ly = distance along petal axis (0 to length)
      // lx = lateral distance (-Rx to +Rx)
      const ly = rx * dx + ry * dy;
      const lx = rx * px + ry * py;

      if (ly < -1 || ly > length + 2) continue;

      // Compute maximum half-width at distance ly
      let maxW;
      if (ly >= yc) {
        const normY = (ly - yc) / Ry;
        if (normY > 1.0) continue;
        maxW = Rx * Math.sqrt(Math.max(0, 1 - normY * normY));
      } else {
        const t = Math.max(0, ly / yc);
        // Smooth swell from basal claw to lobe
        maxW = Rx * (0.18 + 0.82 * Math.sqrt(t));
      }

      // Add gentle organic petal waviness (gợn sóng viền cánh hoa)
      const waviness = 1.0 + 0.024 * Math.sin((ly / length) * 16.0 + angle * 3.0);
      const effectiveMaxW = maxW * waviness;

      const distFromEdge = effectiveMaxW - Math.abs(lx);
      if (distFromEdge < -1.5) continue;

      // Anti-aliased edge alpha
      const alphaEdge = smoothstep(-1.2, 1.2, distFromEdge);
      if (alphaEdge <= 0) continue;

      // Normalized coordinates for shading
      const normL = clamp(ly / length, 0, 1);
      const normW = clamp(Math.abs(lx) / (effectiveMaxW + 0.001), 0, 1);

      // Sample core petal color from botanical ramp
      let col = samplePalette(petalRamp, normL);

      // Botanical petal features:
      // 1. Subtle radiating longitudinal petal veins (gân cánh hoa)
      const veinAngle = Math.atan2(lx, Math.max(1.0, ly));
      const veinPattern = Math.sin(veinAngle * 28.0) * 0.035 * Math.sin(normL * Math.PI);
      
      // 2. Translucent 3D petal curvature (cupping towards center)
      const cupCurvature = (1.0 - normW * normW * 0.18);
      
      // 3. Delicate petal edge rim highlight (viền sáng lấp lánh)
      const edgeGlow = smoothstep(0.82, 0.98, normW) * 0.14 * normL;

      // 4. Subtle lighting modulation from top-left (directional sun)
      const sunAngle = -Math.PI / 4;
      const sunDot = Math.cos(angle + Math.atan2(lx, ly) - sunAngle) * 0.08;

      let r = clamp(col[0] * cupCurvature + veinPattern + edgeGlow + sunDot);
      let g = clamp(col[1] * cupCurvature + veinPattern * 0.8 + edgeGlow + sunDot);
      let b = clamp(col[2] * cupCurvature + veinPattern * 0.2 + edgeGlow * 1.2 + sunDot * 0.5);

      blendPixel(x, y, r, g, b, alphaEdge);
    }
  }
}

/**
 * Renders the dense radiating stamens (Nhị hoa Mai)
 * Mai Vang has a stunning crown of 28-36 reddish-orange radiating filaments with golden pollen tips
 */
function drawMaiStamens(cx, cy, flowerRadius, count = 34, seed = 0) {
  const minR = flowerRadius * 0.08;
  const maxR = flowerRadius * 0.38;

  // Stamen filament color ramp:
  // Reddish-orange/amber #ea580c / #c2410c near base to golden amber #f59e0b
  const stamenColBase = hex('#c2410c'); // Deep reddish orange
  const stamenColMid = hex('#ea580c');  // Vibrant flame orange
  const stamenColTip = hex('#fbbf24');  // Golden amber
  const pollenCol = hex('#fef08a');     // Glowing pollen anther yellow
  const pollenRim = hex('#ffffff');     // Specular sun highlight

  for (let i = 0; i < count; i++) {
    // Slight organic jitter in angle and length
    const pseudoRnd = Math.sin(i * 12.9898 + seed) * 43758.5453;
    const jitter = (pseudoRnd - Math.floor(pseudoRnd)) - 0.5;
    const baseAngle = (i / count) * Math.PI * 2 + jitter * 0.12;

    const stamenLen = lerp(minR, maxR, 0.72 + jitter * 0.28);
    const curveOffset = (jitter > 0 ? 1 : -1) * (flowerRadius * 0.04);

    const x0 = cx + Math.cos(baseAngle) * minR;
    const y0 = cy + Math.sin(baseAngle) * minR;

    const midAngle = baseAngle + (jitter * 0.15);
    const midR = stamenLen * 0.55;
    const xMid = cx + Math.cos(midAngle) * midR + Math.cos(midAngle + Math.PI/2) * curveOffset;
    const yMid = cy + Math.sin(midAngle) * midR + Math.sin(midAngle + Math.PI/2) * curveOffset;

    const xTip = cx + Math.cos(baseAngle) * stamenLen;
    const yTip = cy + Math.sin(baseAngle) * stamenLen;

    // Draw stamen filament (slender curved line)
    drawSegment(x0, y0, xMid, yMid, 1.4 * SCALE, 1.1 * SCALE, stamenColBase, stamenColMid, 0.95);
    drawSegment(xMid, yMid, xTip, yTip, 1.1 * SCALE, 0.9 * SCALE, stamenColMid, stamenColTip, 0.95);

    // Golden pollen anther dot (bao phấn vàng rực rỡ)
    const antherRadius = (1.5 + Math.abs(jitter) * 0.8) * SCALE;
    drawDisk(xTip, yTip, antherRadius, pollenCol, 1.0);
    drawDisk(xTip - 0.4 * SCALE, yTip - 0.4 * SCALE, antherRadius * 0.5, pollenRim, 0.85);
  }
}

/**
 * Renders the central green pistil/carpel (Nhụy hoa mai)
 */
function drawMaiCenterPistil(cx, cy, flowerRadius) {
  const pistilR = flowerRadius * 0.085;

  // Emerald pistil core #4d7c0f / #65a30d / #84cc16
  const greenMid = hex('#4d7c0f');
  const greenLight = hex('#84cc16');

  // Multi-lobed central carpel
  drawDisk(cx, cy, pistilR, greenMid, 1.0);
  drawDisk(cx - pistilR * 0.25, cy - pistilR * 0.25, pistilR * 0.65, greenLight, 0.9);

  // 5 tiny stigma lobes at the very apex
  const lobeCount = 5;
  for (let l = 0; l < lobeCount; l++) {
    const la = (l / lobeCount) * Math.PI * 2;
    const lx = cx + Math.cos(la) * pistilR * 0.7;
    const ly = cy + Math.sin(la) * pistilR * 0.7;
    drawDisk(lx, ly, pistilR * 0.35, greenLight, 0.95);
    drawDisk(lx, ly, pistilR * 0.18, hex('#bef264'), 0.85);
  }
}

/**
 * Draws a complete blooming 5-petal Hoa Mai flower
 */
function drawCompleteMaiFlower(cx, cy, radius, rotAngle = 0, seed = 1) {
  // 5 overlapping petals at 72 degree intervals (2pi / 5)
  const petalCount = 5;
  const petalAngleStep = (Math.PI * 2) / petalCount;
  const petalLen = radius * 0.95;
  const petalWid = radius * 0.82;

  // Draw 5 petals in overlapping clockwise order
  for (let i = 0; i < petalCount; i++) {
    const a = rotAngle + i * petalAngleStep;
    drawMaiPetal(cx, cy, a, petalLen, petalWid, { seed: seed + i });
  }

  // Draw central stamen crown (radiating reddish-orange filaments with golden pollen)
  drawMaiStamens(cx, cy, radius, 34, seed);

  // Draw central emerald carpel / pistil
  drawMaiCenterPistil(cx, cy, radius);
}

/**
 * Draws an authentic green bud (Nụ Mai Xanh)
 * Symbolizes spring vigor and prosperity
 */
function drawMaiBud(cx, cy, dirAngle, size, isBursting = false) {
  const cosA = Math.cos(dirAngle);
  const sinA = Math.sin(dirAngle);
  const dx = cosA;
  const dy = sinA;
  const px = -sinA;
  const py = cosA;

  const L = size * 1.4;
  const W_bud = size * 0.95;

  const minX = Math.max(0, Math.floor(cx - size * 1.6));
  const maxX = Math.min(W - 1, Math.ceil(cx + size * 1.6));
  const minY = Math.max(0, Math.floor(cy - size * 1.6));
  const maxY = Math.min(H - 1, Math.ceil(cy + size * 1.6));

  const sepalDark = hex('#365314');  // Deep calyx olive
  const sepalMid = hex('#4d7c0f');   // Rich green sepal
  const budBright = hex('#84cc16');  // Vibrant spring chartreuse
  const goldenPetal = hex('#facc15');// Golden petal peeking out

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const rx = x - cx;
      const ry = y - cy;

      const ly = rx * dx + ry * dy;
      const lx = rx * px + ry * py;

      if (ly < -2 || ly > L + 2) continue;

      // Teardrop profile: narrow at base, swollen in middle, tapering at tip
      const normY = clamp(ly / L, 0, 1);
      const halfW = (W_bud * 0.5) * Math.sin(Math.pow(normY, 0.6) * Math.PI);

      const dEdge = halfW - Math.abs(lx);
      if (dEdge < -1.5) continue;

      const alphaEdge = smoothstep(-1.2, 1.2, dEdge);
      if (alphaEdge <= 0) continue;

      // 3D spherical lighting
      const normW = clamp(Math.abs(lx) / (halfW + 0.001), 0, 1);
      const sphereShade = Math.sqrt(Math.max(0, 1 - normW * normW));

      let baseCol;
      if (normY < 0.35) {
        // Sepal calyx base
        baseCol = lerpColor(sepalDark, sepalMid, normY / 0.35);
      } else if (normY > 0.82 && isBursting) {
        // Golden petal peeking from bursting bud!
        baseCol = goldenPetal;
      } else {
        // Lush green bud body
        baseCol = lerpColor(sepalMid, budBright, (normY - 0.35) / 0.65);
      }

      // Sunlit highlight on top-left of bud
      const highlight = (lx < 0 ? 0.12 : -0.05) * sphereShade;
      const r = clamp(baseCol[0] * sphereShade + highlight);
      const g = clamp(baseCol[1] * sphereShade + highlight);
      const b = clamp(baseCol[2] * sphereShade + highlight * 0.5);

      blendPixel(x, y, r, g, b, alphaEdge);
    }
  }

  // Small calyx sepal scales wrapping the bud base
  const calyxR = size * 0.28;
  drawDisk(cx - px * calyxR, cy - py * calyxR, calyxR, sepalDark, 0.9);
  drawDisk(cx + px * calyxR, cy + py * calyxR, calyxR, sepalDark, 0.9);
}

/**
 * Draws a young spring leaf / bract (Lộc non)
 */
function drawYoungLeaf(cx, cy, dirAngle, length, width) {
  const cosA = Math.cos(dirAngle);
  const sinA = Math.sin(dirAngle);
  const dx = cosA;
  const dy = sinA;
  const px = -sinA;
  const py = cosA;

  const minX = Math.max(0, Math.floor(cx - length * 1.2));
  const maxX = Math.min(W - 1, Math.ceil(cx + length * 1.2));
  const minY = Math.max(0, Math.floor(cy - length * 1.2));
  const maxY = Math.min(H - 1, Math.ceil(cy + length * 1.2));

  const leafBase = hex('#4d7c0f');  // Spring green base
  const leafMid = hex('#84cc16');   // Bright green leaf body
  const leafTip = hex('#b45309');   // Authentic bronze-amber young leaf tip

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const rx = x - cx;
      const ry = y - cy;

      const ly = rx * dx + ry * dy;
      const lx = rx * px + ry * py;

      if (ly < 0 || ly > length) continue;

      const normY = ly / length;
      // Lanceolate leaf envelope
      const halfW = (width * 0.5) * Math.sin(normY * Math.PI);
      const dEdge = halfW - Math.abs(lx);
      if (dEdge < -1.5) continue;

      const alpha = smoothstep(-1.2, 1.2, dEdge);
      let col = normY < 0.75
        ? lerpColor(leafBase, leafMid, normY / 0.75)
        : lerpColor(leafMid, leafTip, (normY - 0.75) / 0.25);

      blendPixel(x, y, col[0], col[1], col[2], alpha);
    }
  }
}

// =========================================================================
// MAIN GENERATION PIPELINE
// =========================================================================

console.log('Generating authentic Vietnamese Mai Vang (Ochna integerrima) floral texture...');

// Aged bonsai twig bark colors:
// Deep umber bark with warm honey-amber highlights
const barkDark = hex('#2e1406');
const barkMid = hex('#54260d');
const barkWarm = hex('#7c3a16');
const barkTip = hex('#4d7c0f'); // Slender green pedicels

// 1. LAYER 1: TWIGS & BRANCHES (Cành Mai Bonsai)
// Twig 1: Main stem entering from bottom center (x=512, y=1024 in 1024 buffer)
drawBezier(
  { x: 512, y: 1024 },
  { x: 508, y: 880 },
  { x: 520, y: 760 },
  { x: 510, y: 680 },
  8 * SCALE, 6 * SCALE,
  barkDark, barkMid
);

// Twig 2: Left branch arching towards left blossoms
drawBezier(
  { x: 510, y: 680 },
  { x: 420, y: 640 },
  { x: 340, y: 600 },
  { x: 280, y: 560 },
  6 * SCALE, 4 * SCALE,
  barkDark, barkMid
);
drawBezier(
  { x: 280, y: 560 },
  { x: 240, y: 480 },
  { x: 220, y: 400 },
  { x: 230, y: 320 },
  4 * SCALE, 2.5 * SCALE,
  barkMid, barkWarm
);

// Twig 3: Right branch arching towards right blossoms
drawBezier(
  { x: 510, y: 680 },
  { x: 620, y: 640 },
  { x: 720, y: 610 },
  { x: 760, y: 570 },
  6 * SCALE, 4 * SCALE,
  barkDark, barkMid
);
drawBezier(
  { x: 760, y: 570 },
  { x: 800, y: 490 },
  { x: 810, y: 410 },
  { x: 780, y: 330 },
  4 * SCALE, 2.5 * SCALE,
  barkMid, barkWarm
);

// Twig 4: Central spur leading to main commanding blossom
drawBezier(
  { x: 510, y: 680 },
  { x: 512, y: 580 },
  { x: 516, y: 520 },
  { x: 512, y: 460 },
  5.5 * SCALE, 3.5 * SCALE,
  barkMid, barkWarm
);

// Twig 5: Upper branchlets holding swollen buds and top blossom
drawBezier(
  { x: 512, y: 460 },
  { x: 510, y: 360 },
  { x: 520, y: 280 },
  { x: 530, y: 220 },
  3.5 * SCALE, 2 * SCALE,
  barkMid, barkTip
);

// Sub-twigs to buds:
// Top-left bud twigs
drawBezier({ x: 230, y: 320 }, { x: 200, y: 260 }, { x: 220, y: 200 }, { x: 260, y: 150 }, 2.5 * SCALE, 1.5 * SCALE, barkMid, barkTip);
drawBezier({ x: 230, y: 320 }, { x: 170, y: 340 }, { x: 130, y: 380 }, { x: 110, y: 420 }, 2.0 * SCALE, 1.5 * SCALE, barkMid, barkTip);

// Top-right bud twigs
drawBezier({ x: 780, y: 330 }, { x: 820, y: 270 }, { x: 810, y: 210 }, { x: 770, y: 160 }, 2.5 * SCALE, 1.5 * SCALE, barkMid, barkTip);
drawBezier({ x: 780, y: 330 }, { x: 850, y: 360 }, { x: 900, y: 400 }, { x: 920, y: 450 }, 2.0 * SCALE, 1.5 * SCALE, barkMid, barkTip);

// 2. LAYER 2: YOUNG LEAF SPROUTS (Lộc non)
drawYoungLeaf(360, 620, -Math.PI * 0.72, 28 * SCALE, 11 * SCALE);
drawYoungLeaf(660, 630, -Math.PI * 0.28, 28 * SCALE, 11 * SCALE);
drawYoungLeaf(210, 410, -Math.PI * 0.65, 24 * SCALE, 9 * SCALE);
drawYoungLeaf(810, 420, -Math.PI * 0.35, 24 * SCALE, 9 * SCALE);
drawYoungLeaf(480, 310, -Math.PI * 0.85, 22 * SCALE, 8 * SCALE);
drawYoungLeaf(560, 300, -Math.PI * 0.15, 22 * SCALE, 8 * SCALE);

// 3. LAYER 3: FRESH GREEN BUDS (Nụ Mai Xanh & Nụ hé vàng)
// Iconic Tết buds in clusters
drawMaiBud(260, 150, -Math.PI * 0.65, 14 * SCALE, true);  // Swollen bud bursting with gold
drawMaiBud(220, 175, -Math.PI * 0.85, 12 * SCALE, false); // Emerald bud
drawMaiBud(110, 420, Math.PI * 0.75, 12 * SCALE, false);  // Left lower bud
drawMaiBud(130, 460, Math.PI * 0.65, 10 * SCALE, false);  // Left lower twin bud

drawMaiBud(770, 160, -Math.PI * 0.35, 14 * SCALE, true);  // Swollen bud bursting with gold
drawMaiBud(810, 185, -Math.PI * 0.15, 12 * SCALE, false); // Emerald bud
drawMaiBud(920, 450, Math.PI * 0.25, 12 * SCALE, false);  // Right lower bud
drawMaiBud(900, 490, Math.PI * 0.35, 10 * SCALE, false);  // Right lower twin bud

drawMaiBud(530, 130, -Math.PI * 0.50, 15 * SCALE, true);  // Topmost central bursting bud
drawMaiBud(490, 160, -Math.PI * 0.65, 11 * SCALE, false); // Tender small top bud

// 4. LAYER 4: SECONDARY BLOOMING HOA MAI BLOSSOMS
// Flower 2: Left angled blossom
drawCompleteMaiFlower(270, 560, 105 * SCALE, 0.32, 102);

// Flower 3: Right angled blossom
drawCompleteMaiFlower(750, 570, 100 * SCALE, -0.45, 204);

// Flower 4: Upper charming blossom
drawCompleteMaiFlower(530, 240, 95 * SCALE, 0.18, 306);

// 5. LAYER 5: MASTER COMMANDING HOA MAI BLOSSOM (Hoa Mai Đại)
// Centerpiece: Majestic large 5-petal open blossom
drawCompleteMaiFlower(512, 450, 155 * SCALE, 0.08, 408);

// Additional buds nestled gracefully
drawMaiBud(390, 490, -Math.PI * 0.55, 11 * SCALE, false);
drawMaiBud(640, 500, -Math.PI * 0.45, 11 * SCALE, false);

// =========================================================================
// 6. DOWNSAMPLE 2x2 SSAA TO 512x512 RGBA PNG
// =========================================================================
console.log('Downsampling with 2x2 SSAA to target 512x512 PNG...');

const outPng = new PNG({ width: TARGET_SIZE, height: TARGET_SIZE });

for (let ty = 0; ty < TARGET_SIZE; ty++) {
  for (let tx = 0; tx < TARGET_SIZE; tx++) {
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumA = 0;

    // 2x2 supersample block
    for (let sy = 0; sy < SCALE; sy++) {
      for (let sx = 0; sx < SCALE; sx++) {
        const srcX = tx * SCALE + sx;
        const srcY = ty * SCALE + sy;
        const idx = srcY * W + srcX;
        const a = bufA[idx];
        sumR += bufR[idx] * a;
        sumG += bufG[idx] * a;
        sumB += bufB[idx] * a;
        sumA += a;
      }
    }

    const avgA = sumA / (SCALE * SCALE);
    const outIdx = (ty * TARGET_SIZE + tx) * 4;

    if (avgA > 0.001) {
      // Un-premultiply RGB for standard PNG storage
      outPng.data[outIdx + 0] = Math.round(clamp(sumR / sumA, 0, 1) * 255);
      outPng.data[outIdx + 1] = Math.round(clamp(sumG / sumA, 0, 1) * 255);
      outPng.data[outIdx + 2] = Math.round(clamp(sumB / sumA, 0, 1) * 255);
      outPng.data[outIdx + 3] = Math.round(clamp(avgA, 0, 1) * 255);
    } else {
      outPng.data[outIdx + 0] = 0;
      outPng.data[outIdx + 1] = 0;
      outPng.data[outIdx + 2] = 0;
      outPng.data[outIdx + 3] = 0;
    }
  }
}

const outDir = path.join(__dirname, 'public', 'assets', 'leaves');
const outPath = path.join(outDir, 'oak_spring.png');

const pngBuffer = PNG.sync.write(outPng);
fs.writeFileSync(outPath, pngBuffer);

console.log(`Successfully generated authentic Vietnamese Mai Vang texture at ${outPath}`);
console.log(`File size: ${(pngBuffer.length / 1024).toFixed(1)} KB, dimensions: ${TARGET_SIZE}x${TARGET_SIZE}`);
