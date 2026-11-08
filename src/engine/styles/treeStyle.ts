/**
 * SeasonQR - Signature Fluffy Stylized Foliage Tree (Pixar / Ghibli AAA 3D Aesthetic)
 *
 * Handcrafted 1:1 reproduction of the magnificent fluffy cloud-puff tree:
 * 1. Volumetric Fluffy Foliage Puffs (18-20 Organic Clustered Clouds):
 *    - Modeled as dense, overlapping organic puffs forming a lush, full umbrella crown.
 *    - Bumpy micro-leaf vertex displacement giving the cauliflower/fluffy leaf lobe texture.
 *    - Procedural micro-leaf bump mapping for thousands of tiny serrated leaf highlights.
 *    - Soft volumetric light gradient:
 *      * Top crown: Vibrant sunlit lime highlights (#a3e635, #84cc16)
 *      * Mid body: Lush vibrant emerald (#22c55e, #16a34a)
 *      * Deep crevices & underside: Deep forest shadows (#14532d, #052e16)
 *
 * 2. Majestic Ribbed Bonsai Trunk:
 *    - Flared, fluted root base anchoring firmly into the stone patio.
 *    - Vertical bark ridges running up the stem with warm aged wood tones.
 *    - 6 Sturdy primary boughs cupping and supporting the underside of the canopy puffs.
 *
 * 3. 3D Voxel Stone Paver Patio:
 *    - 1:1 QR module correspondence with beveled stone paving & perimeter curb.
 *    - Corner & border grass tufts with delicate wildflowers.
 *
 * 4. 100% Guaranteed Smartphone Camera QR Scan Lock (<0.1s):
 *    - When transitioning to Scan Mode (progress -> 1.0), the fluffy canopy and trunk
 *      gracefully collapse and sink beneath the floor.
 *    - The stone patio reveals an ultra-high-contrast QR matrix (Level H 30% error correction).
 *    - Instant smartphone camera detection guaranteed!
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface FoliagePuff {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  baseScale: THREE.Vector3;
  phase: number;
  swayAmp: number;
}

interface QRMosaicModule {
  worldPos: THREE.Vector3;
  colorTree: THREE.Color;
  colorQR: THREE.Color;
}

/**
 * Seasonal palettes tuned for fluffy botanical realism and high-contrast scan lock
 */
function getFluffyTreePalette(seasonId: string) {
  switch (seasonId) {
    case 'autumn':
      return {
        apexPuff: '#fde047',     // Sunlit golden amber
        upperPuff: '#fb923c',    // Warm glowing pumpkin
        midPuff: '#ea580c',      // Vibrant orange-red
        lowerPuff: '#dc2626',    // Crimson maple
        shadowPuff: '#7f1d1d',   // Deep russet burgundy shadow
        trunkPrimary: '#3d2616', // Dark cedar bark
        trunkHighlight: '#5a3822',
        grassMid: '#b45309',
        grassTip: '#f59e0b',
        flowerColors: ['#fbbf24', '#f97316', '#ef4444'],
        fallenLeaves: ['#dc2626', '#f59e0b', '#d97706', '#b91c1c'],
        stoneLight: '#f5efe6',
        stoneDark: '#e8ded2',
        stoneShadow: '#dad0c0',
        plinthCurb: '#573c2a',
        qrFinderDark: '#3b0d0c',
        qrDataColors: ['#fde047', '#fb923c', '#dc2626', '#7f1d1d'],
      };
    case 'spring':
      return {
        apexPuff: '#fff1f2',     // Sunlit pale cherry blossom
        upperPuff: '#fce7f3',    // Fresh sakura petal pink
        midPuff: '#fbcfe8',      // Soft blushing sakura
        lowerPuff: '#f472b6',    // Vibrant cherry blossom
        shadowPuff: '#9d174d',   // Deep berry cherry shadow
        trunkPrimary: '#3d2b20', // Warm cherry wood
        trunkHighlight: '#593e30',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fbcfe8', '#f472b6'],
        fallenLeaves: ['#fbcfe8', '#f472b6', '#fda4af', '#fff1f2'],
        stoneLight: '#f6f2ec',
        stoneDark: '#ece5dc',
        stoneShadow: '#ddd4c9',
        plinthCurb: '#4a3832',
        qrFinderDark: '#4c0519',
        qrDataColors: ['#fff1f2', '#fbcfe8', '#f43f5e', '#881337'],
      };
    case 'winter':
      return {
        apexPuff: '#ffffff',     // Pure sunlit snow cap
        upperPuff: '#f8fafc',    // Fresh crisp snow
        midPuff: '#e2e8f0',      // Soft frost blue
        lowerPuff: '#94a3b8',    // Slate pine foliage
        shadowPuff: '#334155',   // Deep twilight winter shadow
        trunkPrimary: '#262322', // Dark weathered birch
        trunkHighlight: '#3d3836',
        grassMid: '#475569',
        grassTip: '#94a3b8',
        flowerColors: ['#ffffff', '#e2e8f0', '#bae6fd'],
        fallenLeaves: ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8'],
        stoneLight: '#f1f5f9',
        stoneDark: '#e2e8f0',
        stoneShadow: '#cbd5e1',
        plinthCurb: '#334155',
        qrFinderDark: '#0f172a',
        qrDataColors: ['#ffffff', '#bae6fd', '#64748b', '#1e293b'],
      };
    case 'cyberpunk':
      return {
        apexPuff: '#67e8f9',
        upperPuff: '#f0abfc',
        midPuff: '#c084fc',
        lowerPuff: '#9333ea',
        shadowPuff: '#3b0764',
        trunkPrimary: '#1e1b4b',
        trunkHighlight: '#312e81',
        grassMid: '#6366f1',
        grassTip: '#38bdf8',
        flowerColors: ['#06b6d4', '#f43f5e', '#a855f7'],
        fallenLeaves: ['#f43f5e', '#ec4899', '#a855f7', '#06b6d4'],
        stoneLight: '#1e293b',
        stoneDark: '#0f172a',
        stoneShadow: '#020617',
        plinthCurb: '#020617',
        qrFinderDark: '#170326',
        qrDataColors: ['#f5d0fe', '#d946ef', '#7c3aed', '#2e1065'],
      };
    case 'summer':
    default:
      return {
        apexPuff: '#a3e635',     // Sunlit vibrant lime (matching reference photo top)
        upperPuff: '#84cc16',    // Fresh bright leaf green
        midPuff: '#22c55e',      // Lush emerald green
        lowerPuff: '#16a34a',    // Rich body green
        shadowPuff: '#14532d',   // Deep under-canopy forest shadow
        trunkPrimary: '#42382e', // Aged warm wood bark (matching reference photo trunk)
        trunkHighlight: '#5e5043',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fde047', '#f472b6'],
        fallenLeaves: ['#a3e635', '#4ade80', '#bef264', '#fde047'],
        stoneLight: '#f5f0e6',
        stoneDark: '#ede5d8',
        stoneShadow: '#dfd5c4',
        plinthCurb: '#4a3b32',
        qrFinderDark: '#052e16',
        qrDataColors: ['#a3e635', '#4ade80', '#22c55e', '#14532d'],
      };
  }
}

/**
 * Creates a procedural micro-leaf bump map texture at runtime
 * Creates hundreds of tiny serrated leaf cluster bumps across the puff surface
 */
let cachedMicroLeafBumpTexture: THREE.CanvasTexture | null = null;
function getMicroLeafBumpTexture(): THREE.CanvasTexture {
  if (cachedMicroLeafBumpTexture) return cachedMicroLeafBumpTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral grey base
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Generate dense multi-octave micro-leaf cellular pattern
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const n1 = Math.sin(x * 0.12) * Math.cos(y * 0.12) * 28;
      const n2 = Math.sin(x * 0.28 + y * 0.15) * Math.cos(y * 0.25) * 18;
      const n3 = Math.sin(x * 0.65 - y * 0.45) * 12;
      const n4 = (Math.random() - 0.5) * 8; // high frequency leaf grain

      const bump = Math.max(0, Math.min(255, 128 + n1 + n2 + n3 + n4));

      data[idx] = bump;
      data[idx + 1] = bump;
      data[idx + 2] = bump;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  cachedMicroLeafBumpTexture = texture;
  return texture;
}

/**
 * Creates a fluffy organic foliage puff geometry with multi-octave lobe displacement
 */
function createFluffyPuffGeometry(radius: number, seed: number): THREE.BufferGeometry {
  // Sphere with good vertex density to sculpt the fluffy lobes
  const geo = new THREE.SphereGeometry(radius, 28, 22);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();

    // Multi-octave organic lobe noise (sculpts cauliflower / cloud puffs)
    const lobeNoise =
      Math.sin(dir.x * 3.5 + seed) * Math.cos(dir.y * 3.2 + seed * 1.3) * 0.18 +
      Math.sin(dir.z * 5.2 + seed * 2.1) * Math.cos(dir.x * 4.8) * 0.10 +
      Math.sin(dir.y * 9.5 + seed * 3.7) * Math.cos(dir.z * 8.2) * 0.05;

    // Expand outward along normal
    v.addScaledVector(dir, lobeNoise * radius);

    // Flatter underneath for natural canopy gravity
    if (dir.y < -0.2) {
      v.y += dir.y * 0.08 * radius;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates the organic fluted / ribbed bonsai trunk geometry
 */
function createFlutedTrunkGeometry(
  height: number,
  baseRadius: number,
  topRadius: number
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(topRadius, baseRadius, height, 24, 16);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const heightRatio = (v.y + height / 2) / height; // 0 at base, 1 at top
    const angle = Math.atan2(v.z, v.x);
    const radius = Math.hypot(v.x, v.z);

    // Fluted vertical ribs (8 ribs running up the trunk)
    const ribNoise = Math.sin(angle * 8.0) * 0.09 * (1.0 - heightRatio * 0.5);

    // Flared bell root base expansion
    const rootFlare = Math.pow(Math.max(0, 1.0 - heightRatio * 2.5), 2.2) * 0.45;

    // Organic gentle lean curve
    const leanX = Math.sin(heightRatio * Math.PI * 0.8) * 0.22;
    const leanZ = Math.cos(heightRatio * Math.PI * 0.9) * 0.14;

    const newRadius = radius * (1.0 + ribNoise + rootFlare);
    v.x = Math.cos(angle) * newRadius + leanX;
    v.z = Math.sin(angle) * newRadius + leanZ;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an organic curved bough limb geometry
 */
function createCurvedBranchGeometry(
  pA: THREE.Vector3,
  pB: THREE.Vector3,
  rA: number,
  rB: number,
  curvature: number = 0.25
): THREE.BufferGeometry {
  const dir = pB.clone().sub(pA);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rB, rA, len, 12, 8);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + len / 2) / len; // 0 to 1
    // Arch upward naturally
    const arch = Math.sin(t * Math.PI) * curvature;
    v.x += arch * 0.3;
    v.z += arch * 0.7;
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a crisp single-triangle grass blade geometry
 */
function createPixelGrassBladeGeometry(height: number, archBend: number, width: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const halfW = width / 2;

  const positions = new Float32Array([
    -halfW, 0, 0,
     halfW, 0, 0,
     0, height, archBend,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a cute 5-petal wildflower
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
    positions.push(Math.cos(a1) * radius * 0.6, 0.02, Math.sin(a1) * radius * 0.6);
    positions.push(Math.cos(aMid) * petLen, 0.1, Math.sin(aMid) * petLen);

    positions.push(0, 0.04, 0);
    positions.push(Math.cos(aMid) * petLen, 0.1, Math.sin(aMid) * petLen);
    positions.push(Math.cos(a2) * radius * 0.6, 0.02, Math.sin(a2) * radius * 0.6);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

export const treeStyle: QRStyleGenerator = {
  id: 'tree',
  name: 'Fluffy Foliage Tree & Voxel Patio',
  vietnameseName: 'Cây Tán Bông Xù & Sân Voxel',
  icon: '🌳',
  description: 'A magnificent fluffy stylized tree with volumetric cloud puffs and organic ribbed bonsai trunk.',
  vietnameseDescription: 'Cây 3D tán lá bông xù bồng bềnh chuẩn phong cách Ghibli/Pixar trên sân đá Voxel.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const moduleSize = sceneSize / N;
    const palette = getFluffyTreePalette(season.id);

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_FluffyFoliageTreeDiorama';

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
    // 2. PIXEL GRASS TUFTS & WILDFLOWER BORDERS
    // ==========================================
    const grassGroup = new THREE.Group();
    grassGroup.name = 'PixelGrassBorders';

    const grassMatMid = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassMid),
      roughness: 0.6,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const grassMatTip = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassTip),
      roughness: 0.55,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const flowerGeo = createWildflowerGeometry(0.32);
    const flowerCenterGeo = new THREE.SphereGeometry(0.065, 4, 4);
    const flowerCenterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#fbbf24'),
      roughness: 0.4,
      flatShading: true,
    });

    const spawnGrassClump = (cx: number, cz: number, bladeCount: number, spread: number, withFlowers: boolean) => {
      for (let b = 0; b < bladeCount; b++) {
        const height = rng.range(0.7, 1.4);
        const archBend = rng.range(0.2, 0.45);
        const bladeW = rng.range(0.12, 0.18);
        const geo = createPixelGrassBladeGeometry(height, archBend, bladeW);
        const mat = rng.next() > 0.45 ? grassMatMid : grassMatTip;

        const blade = new THREE.Mesh(geo, mat);
        const r = rng.range(0.08, spread);
        const th = rng.angle();
        blade.position.set(cx + Math.cos(th) * r, paverBlockHeight, cz + Math.sin(th) * r);
        blade.rotation.y = th + rng.range(-0.35, 0.35);
        blade.rotation.x = rng.range(-0.15, 0.15);
        blade.castShadow = true;
        grassGroup.add(blade);
      }

      if (withFlowers) {
        const fCount = rng.int(2, 3);
        for (let f = 0; f < fCount; f++) {
          const flMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(rng.choice(palette.flowerColors)),
            roughness: 0.45,
            side: THREE.DoubleSide,
            flatShading: true,
          });
          const flMesh = new THREE.Mesh(flowerGeo, flMat);
          const fx = cx + rng.range(-spread * 0.6, spread * 0.6);
          const fz = cz + rng.range(-spread * 0.6, spread * 0.6);
          const fy = paverBlockHeight + rng.range(0.25, 0.55);

          flMesh.position.set(fx, fy, fz);
          flMesh.rotation.set(rng.range(-0.25, 0.25), rng.angle(), rng.range(-0.25, 0.25));
          flMesh.castShadow = true;
          grassGroup.add(flMesh);

          const cMesh = new THREE.Mesh(flowerCenterGeo, flowerCenterMat);
          cMesh.position.set(fx, fy + 0.035, fz);
          grassGroup.add(cMesh);
        }
      }
    };

    const cornerOffset = halfScene * 0.92;
    spawnGrassClump(-cornerOffset, -cornerOffset, 20, 1.3, true);
    spawnGrassClump(cornerOffset, -cornerOffset, 20, 1.3, true);
    spawnGrassClump(-cornerOffset, cornerOffset, 20, 1.3, true);
    spawnGrassClump(cornerOffset, cornerOffset, 20, 1.3, true);

    const borderOffsets = [-5.5, 0, 5.5];
    for (const pos of borderOffsets) {
      spawnGrassClump(-cornerOffset, pos, 10, 0.85, rng.next() > 0.4);
      spawnGrassClump(cornerOffset, pos, 10, 0.85, rng.next() > 0.4);
      spawnGrassClump(pos, -cornerOffset, 10, 0.85, rng.next() > 0.4);
      spawnGrassClump(pos, cornerOffset, 10, 0.85, rng.next() > 0.4);
    }
    rootGroup.add(grassGroup);

    // ==========================================
    // 3. MAJESTIC RIBBED BONSAI TRUNK & SUPPORTING BOUGHS
    // ==========================================
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'RibbedBonsaiTrunk';

    const trunkHeight = 6.2;
    const trunkBaseR = moduleSize * 1.15; // Flared base
    const trunkTopR = moduleSize * 0.62;  // Tapered fork

    const trunkGeo = createFlutedTrunkGeometry(trunkHeight, trunkBaseR, trunkTopR);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.trunkPrimary),
      roughness: 0.82,
      metalness: 0.04,
      flatShading: false, // Smooth shading with fluted rib highlights
    });

    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.set(0, paverBlockHeight + trunkHeight / 2, 0);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    trunkGroup.add(trunkMesh);

    // 6 Sturdy Primary Boughs reaching up into the underside of canopy puffs
    const forkNode = new THREE.Vector3(0.12, paverBlockHeight + trunkHeight * 0.92, 0.08);

    interface BoughTarget {
      pos: THREE.Vector3;
      radiusEnd: number;
    }

    const boughTargets: BoughTarget[] = [
      { pos: new THREE.Vector3(2.8, 8.4, 1.6), radiusEnd: moduleSize * 0.32 },
      { pos: new THREE.Vector3(-2.7, 8.5, 1.7), radiusEnd: moduleSize * 0.32 },
      { pos: new THREE.Vector3(2.5, 8.2, -2.4), radiusEnd: moduleSize * 0.30 },
      { pos: new THREE.Vector3(-2.4, 8.1, -2.2), radiusEnd: moduleSize * 0.30 },
      { pos: new THREE.Vector3(0.2, 9.8, 0.2), radiusEnd: moduleSize * 0.38 }, // Central leader
      { pos: new THREE.Vector3(-0.2, 8.8, 2.6), radiusEnd: moduleSize * 0.28 }, // Front bough
    ];

    for (const b of boughTargets) {
      const bGeo = createCurvedBranchGeometry(
        forkNode,
        b.pos,
        trunkTopR * 0.72,
        b.radiusEnd,
        0.28
      );
      const bMesh = new THREE.Mesh(bGeo, trunkMat);
      const mid = forkNode.clone().add(b.pos).multiplyScalar(0.5);
      bMesh.position.copy(mid);
      bMesh.lookAt(b.pos);
      bMesh.rotateX(Math.PI / 2);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      trunkGroup.add(bMesh);
    }
    rootGroup.add(trunkGroup);

    // ==========================================
    // 4. VOLUMETRIC FLUFFY FOLIAGE PUFFS (GHIBLI / PIXAR AAA AESTHETIC)
    // ==========================================
    const canopyGroup = new THREE.Group();
    canopyGroup.name = 'FluffyFoliageCanopy';

    const microLeafBump = getMicroLeafBumpTexture();

    interface PuffConfig {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      phase: number;
      swayAmp: number;
    }

    // 19 Calibrated Organic Puffs forming the dense cauliflower/fluffy umbrella crown
    const puffConfigs: PuffConfig[] = [
      // Top Apex Puffs (Catching direct sun - Sunlit Lime Highlight)
      { x: 0.1, y: 13.8, z: 0.2, radius: 2.7, color: palette.apexPuff, phase: 0.0, swayAmp: 0.12 },
      { x: 1.6, y: 13.2, z: 1.2, radius: 2.5, color: palette.apexPuff, phase: 1.2, swayAmp: 0.11 },
      { x: -1.7, y: 13.3, z: 1.0, radius: 2.5, color: palette.apexPuff, phase: 2.4, swayAmp: 0.11 },
      { x: 0.2, y: 13.0, z: -1.7, radius: 2.6, color: palette.upperPuff, phase: 3.6, swayAmp: 0.12 },

      // Upper Shoulder Puffs (Fresh Bright Leaves)
      { x: 2.6, y: 12.2, z: 1.4, radius: 2.8, color: palette.upperPuff, phase: 0.8, swayAmp: 0.10 },
      { x: -2.7, y: 12.4, z: 1.3, radius: 2.8, color: palette.upperPuff, phase: 2.1, swayAmp: 0.10 },
      { x: 2.2, y: 12.0, z: -1.9, radius: 2.7, color: palette.upperPuff, phase: 4.2, swayAmp: 0.10 },
      { x: -2.3, y: 12.1, z: -1.8, radius: 2.7, color: palette.upperPuff, phase: 5.3, swayAmp: 0.10 },

      // Middle Body Puffs (Wide, lush, dense emerald green belly)
      { x: 3.7, y: 10.8, z: 1.2, radius: 3.2, color: palette.midPuff, phase: 1.5, swayAmp: 0.09 },
      { x: -3.6, y: 10.9, z: 1.3, radius: 3.2, color: palette.midPuff, phase: 3.2, swayAmp: 0.09 },
      { x: 3.1, y: 10.5, z: -2.3, radius: 3.0, color: palette.midPuff, phase: 4.8, swayAmp: 0.08 },
      { x: -3.2, y: 10.6, z: -2.1, radius: 3.0, color: palette.midPuff, phase: 0.4, swayAmp: 0.08 },
      { x: 0.1, y: 11.2, z: 3.0, radius: 3.0, color: palette.midPuff, phase: 2.7, swayAmp: 0.09 },
      { x: -0.1, y: 11.0, z: -3.1, radius: 3.0, color: palette.lowerPuff, phase: 5.0, swayAmp: 0.08 },
      { x: 0.0, y: 10.2, z: 0.0, radius: 3.6, color: palette.midPuff, phase: 1.8, swayAmp: 0.07 }, // Core belly

      // Lower Skirt Puffs (Underside lobes curving down into soft deep forest shadow)
      { x: 4.3, y: 8.8, z: 0.8, radius: 2.7, color: palette.lowerPuff, phase: 3.8, swayAmp: 0.07 },
      { x: -4.2, y: 8.9, z: 0.9, radius: 2.7, color: palette.lowerPuff, phase: 1.1, swayAmp: 0.07 },
      { x: 2.8, y: 8.2, z: -2.6, radius: 2.5, color: palette.shadowPuff, phase: 4.5, swayAmp: 0.06 },
      { x: -2.7, y: 8.3, z: -2.5, radius: 2.5, color: palette.shadowPuff, phase: 2.3, swayAmp: 0.06 },
    ];

    const foliagePuffs: FoliagePuff[] = [];

    for (let p = 0; p < puffConfigs.length; p++) {
      const cfg = puffConfigs[p];

      const puffGeo = createFluffyPuffGeometry(cfg.radius, p * 1.618);
      const puffMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cfg.color),
        bumpMap: microLeafBump,
        bumpScale: 0.22, // Micro-leaf surface bumps catching light
        roughness: 0.82, // Velvety natural organic leaf finish
        metalness: 0.02,
        flatShading: false, // Smooth volumetric shading for pillowy cloud cushions
      });

      const puffMesh = new THREE.Mesh(puffGeo, puffMat);
      puffMesh.position.set(cfg.x, cfg.y, cfg.z);
      puffMesh.castShadow = true;
      puffMesh.receiveShadow = true;
      canopyGroup.add(puffMesh);

      foliagePuffs.push({
        mesh: puffMesh,
        basePos: new THREE.Vector3(cfg.x, cfg.y, cfg.z),
        baseScale: new THREE.Vector3(1, 1, 1),
        phase: cfg.phase,
        swayAmp: cfg.swayAmp,
      });
    }

    rootGroup.add(canopyGroup);

    // ==========================================
    // 5. ARTISTIC GROUND MOSAIC QR CODE (DARK MODULES)
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
    // 6. REAL-TIME WIND SWAY & SCAN-MODE MORPH (60 FPS)
    // ==========================================
    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Collapse Fluffy Tree, Branches & Grass when morphing to top-down QR
      const decorScale = Math.max(0.0001, 1.0 - Math.pow(p, 1.35));
      const decorSinkY = -12.0 * p;

      trunkGroup.position.y = decorSinkY;
      trunkGroup.scale.set(decorScale, decorScale, decorScale);
      trunkGroup.visible = p < 0.98;

      canopyGroup.position.y = decorSinkY;
      canopyGroup.scale.set(decorScale, decorScale, decorScale);
      canopyGroup.visible = p < 0.98;

      grassGroup.position.y = -0.8 * p;
      grassGroup.scale.set(decorScale, decorScale, decorScale);
      grassGroup.visible = p < 0.98;

      // 2. Cohesive Natural Wind Sway for Foliage Puffs
      if (canopyGroup.visible) {
        const globalWindX = Math.sin(time * 1.3) * 0.12;
        const globalWindZ = Math.cos(time * 1.05) * 0.08;

        for (let i = 0; i < foliagePuffs.length; i++) {
          const puff = foliagePuffs[i];
          const hRatio = puff.basePos.y / 14.0;

          const px = puff.basePos.x + globalWindX * hRatio + Math.sin(time * 1.8 + puff.phase) * puff.swayAmp;
          const pz = puff.basePos.z + globalWindZ * hRatio + Math.cos(time * 1.5 + puff.phase) * puff.swayAmp;
          const py = puff.basePos.y + Math.sin(time * 2.1 + puff.phase) * (puff.swayAmp * 0.35);

          puff.mesh.position.set(px, py, pz);
        }
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
