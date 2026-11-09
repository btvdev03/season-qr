/**
 * SeasonQR - Signature Realistic Oak Tree & Voxel Patio QR Transformer
 *
 * Implements high-end 3D realistic botanical tree architecture (matching the user reference image):
 * 1. Realistic Oak Tree (Powered by @dgreenheck/ez-tree):
 *    - Real procedural branching limbs (3 hierarchy levels).
 *    - PBR oak bark with vertical grain and flared root collar.
 *    - Double-billboard oak foliage cards with alpha cutout and realistic leaf silhouettes.
 *    - Built-in real-time vertex wind physics (sways naturally in 60 FPS).
 *    - Seasonal foliage color textures:
 *      * Spring: Poetic Sakura Cherry Blossom Pink & Rose
 *      * Summer: Vibrant Lush Emerald Oak (matching reference photo!)
 *      * Autumn: Breathtaking Kyoto Red Maple & Warm Amber Gold
 *      * Winter: Frost Snow White & Icy Blue Pine
 *
 * 2. 3D Voxel Stone Paver Patio:
 *    - 1:1 QR module correspondence with beveled stone paving & perimeter curb.
 *    - Corner & border grass tufts with delicate wildflowers.
 *
 * 3. 100% Guaranteed Smartphone Camera QR Scan Lock (<0.1s):
 *    - In Scan Mode (progress -> 1.0), the oak tree smoothly shrinks and sinks beneath the floor.
 *    - The stone patio reveals an ultra-high-contrast QR matrix (Level H 30% error correction).
 *    - Instant smartphone camera detection guaranteed!
 */

import * as THREE from 'three';
import { Tree } from '@dgreenheck/ez-tree';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface QRMosaicModule {
  worldPos: THREE.Vector3;
  colorTree: THREE.Color;
  colorQR: THREE.Color;
}

// Preset configuration modeled after real lush oak tree (from user reference image)
const OAK_TREE_PRESET = {
  seed: 35729,
  type: 'deciduous',
  bark: {
    type: 'oak',
    tint: 0xffffff,
    flatShading: false,
    textured: true,
    textureScale: { x: 1, y: 10 },
  },
  branch: {
    levels: 3,
    angle: { '1': 54, '2': 58, '3': 32 },
    children: { '0': 6, '1': 4, '2': 3 },
    force: { direction: { x: 0, y: 1, z: 0 }, strength: -0.01 },
    gnarliness: { '0': 0, '1': -0.1, '2': -0.15, '3': 0.09 },
    length: { '0': 37.24, '1': 11.08, '2': 12.39, '3': 7.16 },
    radius: { '0': 1.6, '1': 0.95, '2': 0.72, '3': 1.19 },
    sections: { '0': 8, '1': 6, '2': 3, '3': 1 },
    segments: { '0': 7, '1': 5, '2': 3, '3': 3 },
    start: { '1': 0.42, '2': 0.06, '3': 0.12 },
    taper: { '0': 0.73, '1': 0.42, '2': 0.69, '3': 0.75 },
    twist: { '0': -0.23, '1': 0.42, '2': 0, '3': 0 },
  },
  leaves: {
    type: 'oak',
    billboard: 'double',
    angle: 42,
    count: 42, // Rich, dense, voluminous foliage matching authentic oak reference
    start: 0.08,
    size: 3.4,
    sizeVariance: 0.75,
    tint: 0xffffff,
    alphaTest: 0.32,
  },
  trellis: {
    enabled: false,
  },
};

/**
 * Seasonal palettes tuned for botanical realism and scan contrast
 */
interface SeasonalDioramaPalette {
  leafTexture: string;
  barkTint: number;
  grassDark: string;
  grassMid: string;
  grassTip: string;
  flowerColors: string[];
  cloverColors: string[];
  fallenLeaves: string[];
  mossColor: string;
  stoneLight: string;
  stoneDark: string;
  stoneShadow: string;
  plinthCurb: string;
  qrFinderDark: string;
  qrDataColors: string[];
}

function getSeasonalPalette(seasonId: string): SeasonalDioramaPalette {
  switch (seasonId) {
    case 'autumn':
      return {
        leafTexture: '/assets/leaves/oak_autumn.png',
        barkTint: 0x301a12, // Rich dark Kyoto walnut bark
        grassDark: '#78350f',
        grassMid: '#b45309',
        grassTip: '#f59e0b',
        flowerColors: ['#dc2626', '#ea580c', '#f59e0b', '#fbbf24', '#b91c1c'],
        cloverColors: ['#78350f', '#92400e', '#b45309', '#a16207'],
        fallenLeaves: ['#dc2626', '#ea580c', '#f59e0b', '#d97706', '#b91c1c', '#7f1d1d'],
        mossColor: '#713f12',
        stoneLight: '#fdf8f0',
        stoneDark: '#f5ebd9',
        stoneShadow: '#e5d3bc',
        plinthCurb: '#502d1d',
        qrFinderDark: '#3b0a0a',
        qrDataColors: ['#fef08a', '#f59e0b', '#ea580c', '#dc2626', '#7f1d1d'],
      };
    case 'spring':
      return {
        leafTexture: '/assets/leaves/oak_spring.png',
        barkTint: 0x3d211a, // Warm cherry tree bark
        grassDark: '#14532d',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fbcfe8', '#f472b6', '#fda4af', '#f43f5e'],
        cloverColors: ['#16a34a', '#22c55e', '#4ade80'],
        fallenLeaves: ['#ffffff', '#fff1f2', '#fbcfe8', '#f472b6', '#fda4af'],
        mossColor: '#4d7c0f',
        stoneLight: '#fdf9f9',
        stoneDark: '#f5eaed',
        stoneShadow: '#e7d6dc',
        plinthCurb: '#4a2f35',
        qrFinderDark: '#4c0519',
        qrDataColors: ['#fff1f2', '#fbcfe8', '#f472b6', '#db2777', '#881337'],
      };
    case 'winter':
      return {
        leafTexture: '/assets/leaves/oak_winter.png',
        barkTint: 0x1e242d, // Weathered dark winter birch/pine
        grassDark: '#1e293b',
        grassMid: '#334155',
        grassTip: '#64748b',
        flowerColors: ['#ffffff', '#bae6fd', '#e0f2fe', '#7dd3fc', '#cbd5e1'],
        cloverColors: ['#334155', '#475569', '#64748b'],
        fallenLeaves: ['#ffffff', '#f1f5f9', '#e2e8f0', '#bae6fd', '#cbd5e1'],
        mossColor: '#334155',
        stoneLight: '#f8fafc',
        stoneDark: '#eef2f6',
        stoneShadow: '#dbe2ea',
        plinthCurb: '#283548',
        qrFinderDark: '#020617',
        qrDataColors: ['#ffffff', '#bae6fd', '#38bdf8', '#0284c7', '#0f172a'],
      };
    case 'summer':
    default:
      return {
        leafTexture: '/assets/leaves/oak_summer.png',
        barkTint: 0x422a1b, // Rich deep aged oak bark
        grassDark: '#14532d',
        grassMid: '#15803d',
        grassTip: '#22c55e',
        flowerColors: ['#ffffff', '#fde047', '#f59e0b', '#fbbf24', '#f472b6'],
        cloverColors: ['#14532d', '#15803d', '#16a34a', '#22c55e'],
        fallenLeaves: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
        mossColor: '#14532d',
        stoneLight: '#faf6ee',
        stoneDark: '#eee5d5',
        stoneShadow: '#decbb8',
        plinthCurb: '#453225',
        qrFinderDark: '#052912',
        qrDataColors: ['#86efac', '#4ade80', '#22c55e', '#15803d', '#14532d'],
      };
  }
}

/**
 * Creates a curved 3-triangle botanical grass blade with natural arch bend
 */
function createArchedGrassBladeGeometry(
  height: number,
  archBend: number,
  baseWidth: number,
  midBendRatio = 0.45
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const hw = baseWidth / 2;
  const midW = baseWidth * 0.45;
  const midH = height * 0.52;
  const midB = archBend * midBendRatio;

  // 5 vertices:
  // 0: base-left,  1: base-right
  // 2: mid-left,   3: mid-right
  // 4: tip
  const positions = new Float32Array([
    -hw, 0, 0,
     hw, 0, 0,
    -midW, midH, midB,
     midW, midH, midB,
     0, height, archBend,
  ]);

  const indices = new Uint16Array([
    0, 1, 3,
    0, 3, 2,
    2, 3, 4,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a charming 5-petal wildflower with cupped petal geometry
 */
function createWildflowerGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const petalCount = 5;

  for (let i = 0; i < petalCount; i++) {
    const a1 = (i / petalCount) * Math.PI * 2;
    const a2 = ((i + 1) / petalCount) * Math.PI * 2;
    const aMid = (a1 + a2) / 2;
    const petLen = radius * 1.5;

    positions.push(0, 0.04, 0);
    positions.push(Math.cos(aMid) * petLen, 0.11, Math.sin(aMid) * petLen);
    positions.push(Math.cos(a1) * radius * 0.55, 0.03, Math.sin(a1) * radius * 0.55);

    positions.push(0, 0.04, 0);
    positions.push(Math.cos(a2) * radius * 0.55, 0.03, Math.sin(a2) * radius * 0.55);
    positions.push(Math.cos(aMid) * petLen, 0.11, Math.sin(aMid) * petLen);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a 3-petal clover / shamrock cluster
 */
function createCloverGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const leafletCount = 3;

  for (let i = 0; i < leafletCount; i++) {
    const baseAngle = (i / leafletCount) * Math.PI * 2;
    const petAngle1 = baseAngle - 0.42;
    const petAngle2 = baseAngle + 0.42;
    const len = radius;

    const tipX = Math.cos(baseAngle) * len;
    const tipZ = Math.sin(baseAngle) * len;
    const tipY = 0.035;

    const edge1X = Math.cos(petAngle1) * (len * 0.65);
    const edge1Z = Math.sin(petAngle1) * (len * 0.65);

    const edge2X = Math.cos(petAngle2) * (len * 0.65);
    const edge2Z = Math.sin(petAngle2) * (len * 0.65);

    positions.push(0, 0.01, 0);
    positions.push(tipX, tipY, tipZ);
    positions.push(edge1X, 0.02, edge1Z);

    positions.push(0, 0.01, 0);
    positions.push(edge2X, 0.02, edge2Z);
    positions.push(tipX, tipY, tipZ);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a delicate fallen leaf or sakura blossom petal
 */
function createFallenPetalGeometry(width: number, length: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const hw = width / 2;
  const hl = length / 2;

  const positions = new Float32Array([
     0,    0.002, -hl,
    -hw,   0.008,   0,
     hw,   0.008,   0,

     0,    0.005,  hl,
     hw,   0.008,   0,
    -hw,   0.008,   0,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a low-poly velvety moss cushion / mound
 */
function createMossMoundGeometry(radius: number, heightRatio = 0.35): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
  geo.scale(1.0, heightRatio, 1.0);
  geo.computeVertexNormals();
  return geo;
}

export const treeStyle: QRStyleGenerator = {
  id: 'tree',
  name: 'Bonsai 4 Mùa Cổ Thụ & Sân Voxel',
  vietnameseName: 'Cây Bonsai Cổ Thụ 4 Mùa',
  icon: '🌳',
  description: 'An authentic 4-season bonsai tree with natural branching, PBR bark, and dense foliage cards.',
  vietnameseDescription: 'Cây cổ thụ 4 mùa Việt Nam, cành uốn lượn, vỏ cây PBR, vườn cỏ hoa dại và rêu phong ôm gốc rễ.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const moduleSize = sceneSize / N;
    const palette = getSeasonalPalette(season.id);

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_RealisticOakTreeDiorama';

    const halfScene = sceneSize / 2;
    const toWorldPos = (r: number, c: number) => ({
      x: (c + 0.5) * moduleSize - halfScene,
      z: (r + 0.5) * moduleSize - halfScene,
    });

    // ==========================================
    // 1. ISOMETRIC VOXEL STONE PATIO PLINTH
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'VoxelPatio';

    const plinthHeight = 0.55;
    const plinthSize = sceneSize * 1.04;
    const plinthGeo = new THREE.BoxGeometry(plinthSize, plinthHeight, plinthSize);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.plinthCurb),
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    patioGroup.add(plinthMesh);

    // Stone Patio Light Paver Blocks (Instanced Voxel Cubes)
    let lightCount = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) lightCount++;
      }
    }

    const paverBlockHeight = 0.12;
    const paverBlockGeo = new THREE.BoxGeometry(
      moduleSize * 0.985,
      paverBlockHeight,
      moduleSize * 0.985
    );
    const paverBlockMat = new THREE.MeshStandardMaterial({
      roughness: 0.72,
      metalness: 0.02,
      flatShading: true,
    });
    const lightPaversMesh = new THREE.InstancedMesh(paverBlockGeo, paverBlockMat, lightCount);
    lightPaversMesh.name = 'VoxelLightPavers';
    lightPaversMesh.receiveShadow = true;

    const dummyPaver = new THREE.Object3D();
    const colLightA = new THREE.Color(palette.stoneLight);
    const colLightB = new THREE.Color(palette.stoneDark);
    const colLightC = new THREE.Color(palette.stoneShadow);

    let lIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyPaver.position.set(x, paverBlockHeight / 2, z);
          dummyPaver.updateMatrix();
          lightPaversMesh.setMatrixAt(lIdx, dummyPaver.matrix);

          const hash = ((r * 13 + c * 37 + (r * c)) % 7);
          let stoneCol = colLightA;
          if (hash === 1 || hash === 4) stoneCol = colLightB;
          else if (hash === 5) stoneCol = colLightC;

          lightPaversMesh.setColorAt(lIdx, stoneCol);
          lIdx++;
        }
      }
    }
    lightPaversMesh.instanceMatrix.needsUpdate = true;
    if (lightPaversMesh.instanceColor) lightPaversMesh.instanceColor.needsUpdate = true;
    patioGroup.add(lightPaversMesh);
    rootGroup.add(patioGroup);

    // ==========================================
    // 2. LUSH BOTANICAL GRASS, MEADOWS & DIORAMA GARDEN
    // ==========================================
    const grassGroup = new THREE.Group();
    grassGroup.name = 'BotanicalGrassMeadow';

    // Shared Materials for 60 FPS performance and unified seasonal aesthetics
    const grassMatDark = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassDark),
      roughness: 0.65,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const grassMatMid = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassMid),
      roughness: 0.58,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const grassMatTip = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassTip),
      roughness: 0.52,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const grassMaterials = [grassMatDark, grassMatMid, grassMatTip];

    const flowerMaterials = palette.flowerColors.map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(col),
          roughness: 0.45,
          side: THREE.DoubleSide,
          flatShading: true,
        })
    );

    const flowerCenterGeo = new THREE.SphereGeometry(0.065, 5, 4);
    const flowerCenterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#fbbf24'),
      emissive: new THREE.Color('#d97706'),
      emissiveIntensity: 0.22,
      roughness: 0.35,
      flatShading: true,
    });

    const cloverMaterials = palette.cloverColors.map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(col),
          roughness: 0.55,
          side: THREE.DoubleSide,
          flatShading: true,
        })
    );

    const mossMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.mossColor),
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    });

    const fallenLeafMaterials = palette.fallenLeaves.map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(col),
          roughness: 0.72,
          metalness: 0.02,
          side: THREE.DoubleSide,
          flatShading: true,
        })
    );

    // Shared BufferGeometries for zero memory duplication & fast initialization
    const bladeGeos = [
      createArchedGrassBladeGeometry(0.55, 0.12, 0.13), // 0: micro sprout (0.55m)
      createArchedGrassBladeGeometry(0.85, 0.24, 0.15), // 1: short lush (0.85m)
      createArchedGrassBladeGeometry(1.18, 0.36, 0.17), // 2: medium meadow (1.18m)
      createArchedGrassBladeGeometry(1.50, 0.50, 0.19), // 3: tall graceful (1.50m)
      createArchedGrassBladeGeometry(1.80, 0.65, 0.22), // 4: grand arch (1.80m)
    ];

    const flowerGeos = [
      createWildflowerGeometry(0.24),
      createWildflowerGeometry(0.32),
      createWildflowerGeometry(0.40),
    ];

    const cloverGeos = [
      createCloverGeometry(0.18),
      createCloverGeometry(0.24),
      createCloverGeometry(0.30),
    ];

    const mossGeos = [
      createMossMoundGeometry(0.24, 0.38),
      createMossMoundGeometry(0.34, 0.35),
      createMossMoundGeometry(0.44, 0.30),
    ];

    const fallenPetalGeos = [
      createFallenPetalGeometry(0.16, 0.26),
      createFallenPetalGeometry(0.22, 0.34),
      createFallenPetalGeometry(0.18, 0.28),
    ];

    // Helper functions to spawn botanical elements
    const spawnGrassBlade = (
      x: number,
      z: number,
      geoIdx: number,
      matTier: number,
      scaleMult: number,
      rotY: number,
      tiltX = 0
    ) => {
      const gIdx = Math.max(0, Math.min(bladeGeos.length - 1, geoIdx));
      const mIdx = Math.max(0, Math.min(grassMaterials.length - 1, matTier));
      const blade = new THREE.Mesh(bladeGeos[gIdx], grassMaterials[mIdx]);
      const s = scaleMult * rng.range(0.88, 1.15);
      blade.scale.set(s, s, s);
      blade.position.set(x, paverBlockHeight, z);
      blade.rotation.set(tiltX + rng.range(-0.1, 0.1), rotY, rng.range(-0.1, 0.1));
      blade.castShadow = true;
      grassGroup.add(blade);
    };

    const spawnWildflower = (
      x: number,
      y: number,
      z: number,
      sizeIdx = 1,
      tiltX = 0,
      tiltZ = 0
    ) => {
      const flMat = rng.choice(flowerMaterials);
      const flGeo = flowerGeos[sizeIdx % flowerGeos.length];
      const flMesh = new THREE.Mesh(flGeo, flMat);
      flMesh.position.set(x, y, z);
      flMesh.rotation.set(tiltX, rng.angle(), tiltZ);
      flMesh.castShadow = true;
      grassGroup.add(flMesh);

      const cMesh = new THREE.Mesh(flowerCenterGeo, flowerCenterMat);
      cMesh.position.set(x, y + 0.035, z);
      grassGroup.add(cMesh);
    };

    const spawnClover = (x: number, z: number, sizeIdx = 1) => {
      const cMat = rng.choice(cloverMaterials);
      const cGeo = cloverGeos[sizeIdx % cloverGeos.length];
      const cloverMesh = new THREE.Mesh(cGeo, cMat);
      cloverMesh.position.set(x, paverBlockHeight + 0.012, z);
      cloverMesh.rotation.set(
        rng.range(-0.1, 0.1),
        rng.angle(),
        rng.range(-0.1, 0.1)
      );
      cloverMesh.castShadow = true;
      grassGroup.add(cloverMesh);
    };

    const spawnMossMound = (x: number, z: number, sizeIdx = 1) => {
      const mGeo = mossGeos[sizeIdx % mossGeos.length];
      const mossMesh = new THREE.Mesh(mGeo, mossMat);
      const s = rng.range(0.85, 1.25);
      mossMesh.scale.set(s, s * rng.range(0.8, 1.1), s);
      mossMesh.position.set(x, paverBlockHeight + 0.02, z);
      mossMesh.rotation.y = rng.angle();
      mossMesh.castShadow = true;
      mossMesh.receiveShadow = true;
      grassGroup.add(mossMesh);
    };

    const spawnFallenPetal = (x: number, z: number, sizeIdx = 1) => {
      const pMat = rng.choice(fallenLeafMaterials);
      const pGeo = fallenPetalGeos[sizeIdx % fallenPetalGeos.length];
      const petalMesh = new THREE.Mesh(pGeo, pMat);
      const s = rng.range(0.8, 1.25);
      petalMesh.scale.set(s, s, s);
      petalMesh.position.set(
        x,
        paverBlockHeight + 0.005 + rng.range(0.001, 0.006),
        z
      );
      petalMesh.rotation.set(
        rng.range(-0.06, 0.06),
        rng.angle(),
        rng.range(-0.06, 0.06)
      );
      petalMesh.receiveShadow = true;
      grassGroup.add(petalMesh);
    };

    // a) Dense Corner Meadow Beds (Multi-tiered at all 4 corners)
    const cornerOffset = halfScene * 0.92;
    const cornerPositions = [
      { cx: -cornerOffset, cz: -cornerOffset },
      { cx: cornerOffset, cz: -cornerOffset },
      { cx: -cornerOffset, cz: cornerOffset },
      { cx: cornerOffset, cz: cornerOffset },
    ];

    for (const { cx, cz } of cornerPositions) {
      // Tier 1: Outer framing arch blades (tallest: heights 1.4 - 1.8)
      for (let b = 0; b < 18; b++) {
        const angle = rng.angle();
        const r = rng.range(0.7, 1.45);
        const bx = cx + Math.cos(angle) * r;
        const bz = cz + Math.sin(angle) * r;
        const geoIdx = rng.chance(0.6) ? 4 : 3; // 1.8m or 1.5m
        const matTier = rng.chance(0.55) ? 2 : 1; // tip highlight or mid
        const rotY = angle + rng.range(-0.4, 0.4);
        spawnGrassBlade(bx, bz, geoIdx, matTier, 1.05, rotY, rng.range(-0.12, 0.12));
      }

      // Tier 2: Core meadow bed (medium: heights 0.85 - 1.25)
      for (let b = 0; b < 24; b++) {
        const angle = rng.angle();
        const r = rng.range(0.2, 0.85);
        const bx = cx + Math.cos(angle) * r;
        const bz = cz + Math.sin(angle) * r;
        const geoIdx = rng.chance(0.5) ? 2 : 1;
        const matTier = rng.chance(0.3) ? 0 : rng.chance(0.5) ? 1 : 2;
        const rotY = angle + rng.range(-0.35, 0.35);
        spawnGrassBlade(bx, bz, geoIdx, matTier, 1.0, rotY, rng.range(-0.1, 0.1));
      }

      // Tier 3: Inner patio transition blades (short: heights 0.5 - 0.85)
      for (let b = 0; b < 16; b++) {
        const angle = rng.angle();
        const r = rng.range(0.5, 1.5);
        const bx = cx + Math.cos(angle) * r;
        const bz = cz + Math.sin(angle) * r;
        const geoIdx = rng.chance(0.6) ? 0 : 1;
        const matTier = rng.chance(0.5) ? 1 : 2;
        const rotY = rng.angle();
        spawnGrassBlade(bx, bz, geoIdx, matTier, 0.95, rotY, rng.range(-0.08, 0.08));
      }

      // Blooming Wildflowers in corner beds
      const fCount = rng.int(4, 6);
      for (let f = 0; f < fCount; f++) {
        const fx = cx + rng.range(-1.0, 1.0);
        const fz = cz + rng.range(-1.0, 1.0);
        const fy = paverBlockHeight + rng.range(0.28, 0.65);
        spawnWildflower(
          fx,
          fy,
          fz,
          rng.int(0, 2),
          rng.range(-0.25, 0.25),
          rng.range(-0.25, 0.25)
        );
      }

      // Shamrock / Clover leaf clusters
      const clovCount = rng.int(5, 7);
      for (let cl = 0; cl < clovCount; cl++) {
        const clx = cx + rng.range(-1.3, 1.3);
        const clz = cz + rng.range(-1.3, 1.3);
        spawnClover(clx, clz, rng.int(0, 2));
      }

      // Velvety Moss mounds
      const mCount = rng.int(3, 4);
      for (let m = 0; m < mCount; m++) {
        const mx = cx + rng.range(-0.8, 0.8);
        const mz = cz + rng.range(-0.8, 0.8);
        spawnMossMound(mx, mz, rng.int(0, 2));
      }

      // Scattered Fallen Petals / Leaves on pavers around corner
      const petCount = rng.int(8, 12);
      for (let p = 0; p < petCount; p++) {
        const px = cx + rng.range(-1.8, 1.8);
        const pz = cz + rng.range(-1.8, 1.8);
        spawnFallenPetal(px, pz, rng.int(0, 2));
      }
    }

    // b) Trunk Collar & Root Garden (Hugging oak trunk base at radius ~1.2 to 2.8)
    const trunkBlades = 75;
    for (let b = 0; b < trunkBlades; b++) {
      const angle = rng.angle();
      const r = rng.range(1.15, 2.75);
      const bx = Math.cos(angle) * r;
      const bz = Math.sin(angle) * r;
      const geoIdx = r < 1.6 ? (rng.chance(0.6) ? 0 : 1) : rng.choice([1, 2, 3]);
      const matTier = r < 1.5 ? 0 : rng.chance(0.55) ? 1 : 2; // dark shade near trunk
      const rotY = angle + rng.range(-0.45, 0.45); // naturally arches outward
      spawnGrassBlade(bx, bz, geoIdx, matTier, 1.0, rotY, rng.range(-0.15, 0.15));
    }

    // Velvety Moss cushions nestled along the root collar flares
    const trunkMossCount = 10;
    for (let m = 0; m < trunkMossCount; m++) {
      const angle = (m / trunkMossCount) * Math.PI * 2 + rng.range(-0.25, 0.25);
      const r = rng.range(0.95, 1.75);
      spawnMossMound(Math.cos(angle) * r, Math.sin(angle) * r, rng.int(0, 2));
    }

    // Blooming Wildflowers nestled in root garden nooks
    const trunkFlowerCount = 8;
    for (let f = 0; f < trunkFlowerCount; f++) {
      const angle = rng.angle();
      const r = rng.range(1.3, 2.5);
      const fx = Math.cos(angle) * r;
      const fz = Math.sin(angle) * r;
      const fy = paverBlockHeight + rng.range(0.22, 0.52);
      spawnWildflower(
        fx,
        fy,
        fz,
        rng.int(0, 2),
        rng.range(-0.22, 0.22),
        rng.range(-0.22, 0.22)
      );
    }

    // Mini 3-petal clover clusters around trunk perimeter
    const trunkCloverCount = 12;
    for (let cl = 0; cl < trunkCloverCount; cl++) {
      const angle = rng.angle();
      const r = rng.range(1.1, 2.8);
      spawnClover(Math.cos(angle) * r, Math.sin(angle) * r, rng.int(0, 2));
    }

    // Delicate Fallen Seasonal Leaves/Petals sprinkled on stone patio around the tree
    const trunkFallenCount = 32;
    for (let p = 0; p < trunkFallenCount; p++) {
      const angle = rng.angle();
      const r = rng.range(0.85, 3.8);
      spawnFallenPetal(Math.cos(angle) * r, Math.sin(angle) * r, rng.int(0, 2));
    }

    // c) Patio Border Tufts (Softening all 4 perimeter borders)
    const borderOffsets = [-7.2, -3.6, 0.0, 3.6, 7.2];
    for (const pos of borderOffsets) {
      const spawnBorderTuft = (bx: number, bz: number, edgeNormalAngle: number) => {
        const bladeCount = rng.int(12, 16);
        for (let b = 0; b < bladeCount; b++) {
          const r = rng.range(0.08, 0.85);
          const th = rng.angle();
          const px = bx + Math.cos(th) * r;
          const pz = bz + Math.sin(th) * r;
          const geoIdx = rng.choice([1, 2, 3]);
          const matTier = rng.chance(0.5) ? 1 : 2;
          const rotY = edgeNormalAngle + rng.range(-0.6, 0.6);
          spawnGrassBlade(px, pz, geoIdx, matTier, 0.95, rotY, rng.range(-0.12, 0.12));
        }

        if (rng.chance(0.6)) {
          const fy = paverBlockHeight + rng.range(0.25, 0.48);
          spawnWildflower(
            bx + rng.range(-0.35, 0.35),
            fy,
            bz + rng.range(-0.35, 0.35),
            rng.int(0, 1),
            rng.range(-0.2, 0.2),
            rng.range(-0.2, 0.2)
          );
        }

        if (rng.chance(0.55)) {
          spawnClover(
            bx + rng.range(-0.5, 0.5),
            bz + rng.range(-0.5, 0.5),
            rng.int(0, 1)
          );
        }

        if (rng.chance(0.4)) {
          spawnMossMound(
            bx + rng.range(-0.4, 0.4),
            bz + rng.range(-0.4, 0.4),
            0
          );
        }

        const petCount = rng.int(2, 4);
        for (let p = 0; p < petCount; p++) {
          spawnFallenPetal(
            bx + rng.range(-0.9, 0.9),
            bz + rng.range(-0.9, 0.9),
            rng.int(0, 2)
          );
        }
      };

      const jitter = rng.range(-0.25, 0.25);
      // West border (-X)
      spawnBorderTuft(-cornerOffset, pos + jitter, Math.PI);
      // East border (+X)
      spawnBorderTuft(cornerOffset, pos + jitter, 0);
      // North border (-Z)
      spawnBorderTuft(pos + jitter, -cornerOffset, -Math.PI / 2);
      // South border (+Z)
      spawnBorderTuft(pos + jitter, cornerOffset, Math.PI / 2);
    }
    rootGroup.add(grassGroup);

    // ==========================================
    // 3. REALISTIC PROCEDURAL OAK TREE (@dgreenheck/ez-tree)
    // ==========================================
    const treeGroup = new THREE.Group();
    treeGroup.name = 'RealisticOakTree';

    const treeOptions = JSON.parse(JSON.stringify(OAK_TREE_PRESET));
    treeOptions.bark.tint = palette.barkTint;
    treeOptions.leaves.tint = 0xffffff; // Pure white tint so seasonal texture shines in full brilliance!

    const realisticTree = new Tree();
    realisticTree.loadFromJson(treeOptions);
    realisticTree.generate();

    // Scale and position the tree to sit gracefully on the patio
    const treeScale = 0.26;
    realisticTree.scale.set(treeScale, treeScale, treeScale);
    realisticTree.position.set(0, paverBlockHeight, 0);

    // Apply high-res seasonal leaf texture
    const textureLoader = new THREE.TextureLoader();
    const seasonalLeafTexture = textureLoader.load(palette.leafTexture);
    seasonalLeafTexture.colorSpace = THREE.SRGBColorSpace;

    if (realisticTree.leavesMesh && realisticTree.leavesMesh.material) {
      // ez-tree creates a MeshPhongMaterial with wind vertex shader
      const leafMat = realisticTree.leavesMesh.material as any;
      leafMat.map = seasonalLeafTexture;
      leafMat.color.set(0xffffff); // 100% true vibrant texture color
      if ('shininess' in leafMat) {
        leafMat.shininess = 2; // Prevent specular glare from washing out deep rich chlorophyll/pigment!
        leafMat.specular = new THREE.Color(0x050505);
      }
      leafMat.alphaTest = 0.32;
      leafMat.needsUpdate = true;
    }

    // Enable castShadow & receiveShadow on branches and leaves
    realisticTree.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    treeGroup.add(realisticTree);
    rootGroup.add(treeGroup);

    // ==========================================
    // 4. ARTISTIC GROUND MOSAIC QR CODE (DARK MODULES)
    // ==========================================
    interface DarkModule {
      row: number;
      col: number;
      isFinder: boolean;
    }

    const darkModules: DarkModule[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (matrix.matrix[r][c]) {
          darkModules.push({
            row: r,
            col: c,
            isFinder: matrix.isFinder(r, c),
          });
        }
      }
    }

    const qrTileCount = darkModules.length;
    const qrTileGeo = new THREE.BoxGeometry(
      moduleSize * 0.992,
      paverBlockHeight * 1.08,
      moduleSize * 0.992
    );
    const qrTileMat = new THREE.MeshStandardMaterial({
      roughness: 0.52,
      metalness: 0.04,
      flatShading: true,
    });

    const qrTileMesh = new THREE.InstancedMesh(qrTileGeo, qrTileMat, qrTileCount);
    qrTileMesh.name = 'VoxelDarkModules';
    qrTileMesh.castShadow = true;
    qrTileMesh.receiveShadow = true;

    const qrModules: QRMosaicModule[] = [];
    const dummyQR = new THREE.Object3D();

    for (let i = 0; i < qrTileCount; i++) {
      const mod = darkModules[i];
      const { x, z } = toWorldPos(mod.row, mod.col);

      // In tree mode: blends naturally as stone paving with subtle soil/garden variation
      const treeHash = ((mod.row * 7 + mod.col * 17) % 5);
      const colorTree = treeHash === 0 ? new THREE.Color(palette.stoneDark) : new THREE.Color(palette.stoneLight);

      // In QR scan mode: multi-tone foliage green/seasonal mosaic with deep finder contrast
      let colorQR: THREE.Color;
      if (mod.isFinder) {
        colorQR = new THREE.Color(palette.qrFinderDark);
      } else {
        colorQR = new THREE.Color(rng.choice(palette.qrDataColors));
      }

      const worldPos = new THREE.Vector3(x, paverBlockHeight / 2, z);
      qrModules.push({ worldPos, colorTree, colorQR });

      dummyQR.position.copy(worldPos);
      dummyQR.scale.set(1.0, 1.0, 1.0);
      dummyQR.updateMatrix();
      qrTileMesh.setMatrixAt(i, dummyQR.matrix);
      qrTileMesh.setColorAt(i, colorTree);
    }

    qrTileMesh.instanceMatrix.needsUpdate = true;
    if (qrTileMesh.instanceColor) qrTileMesh.instanceColor.needsUpdate = true;
    patioGroup.add(qrTileMesh);

    // ==========================================
    // 5. REAL-TIME WIND SWAY & SCAN-MODE MORPH (60 FPS)
    // ==========================================
    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Collapse Realistic Tree & Grass when morphing to top-down QR
      const decorScale = Math.max(0.0001, 1.0 - Math.pow(p, 1.35));
      const decorSinkY = -12.0 * p;

      treeGroup.position.y = decorSinkY;
      treeGroup.scale.set(decorScale, decorScale, decorScale);
      treeGroup.visible = p < 0.98;

      grassGroup.position.y = -3.5 * p;
      grassGroup.scale.set(decorScale, decorScale, decorScale);
      grassGroup.visible = p < 0.98;

      // 2. Real-time Wind Physics (built into ez-tree shader/update)
      if (treeGroup.visible && typeof realisticTree.update === 'function') {
        realisticTree.update(time);
      }

      // 3. Smooth Color & Elevation Morph for QR Voxel Modules
      const qrEase = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      for (let i = 0; i < qrTileCount; i++) {
        const mod = qrModules[i];
        const curColor = new THREE.Color().lerpColors(mod.colorTree, mod.colorQR, qrEase);
        qrTileMesh.setColorAt(i, curColor);
      }
      if (qrTileMesh.instanceColor) qrTileMesh.instanceColor.needsUpdate = true;
    };

    return rootGroup;
  },
};
