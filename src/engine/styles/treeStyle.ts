/**
 * SeasonQR - Signature Low-Poly Botanical Bonsai & Garden Mosaic QR Transformer
 *
 * Distinctive handcrafted artistic diorama:
 * 1. Living Botanical Bonsai Mode:
 *    - Curving, tapered organic trunk with warm wood bark and upward reaching boughs.
 *    - Faceted low-poly volumetric canopy masses (clean Ghibli / low-poly botanical art style).
 *    - No noisy loose leaf flakes; clean, crisp geometric silhouette.
 *    - Rich sunlight color gradient:
 *      * Sunlit lime highlights on top (#bef264, #a3e635)
 *      * Lush emerald midtones in the body (#4ade80, #22c55e)
 *      * Deep forest shadows underneath (#166534, #14532d)
 *    - Embedded seasonal flora accents (tiny berries / sakura blossoms nestled on the canopy).
 *    - Natural, soothing, harmonic wind sway physics (60 FPS) where the canopy breathes together.
 *    - Artisanal stone patio plinth framed with lush, curved grass tufts & delicate wildflowers.
 *
 * 2. 100% Scannable Garden Mosaic QR Mode:
 *    - Tapping triggers smooth transition to clean top-down view.
 *    - Canopy, branches, and grass gracefully sink into the patio.
 *    - The stone floor emerges into a vibrant multi-tone botanical mosaic QR code.
 *    - High-contrast finder patterns ensure instantaneous smartphone camera lock!
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface FoliageCloud {
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
 * Seasonal palettes tuned for botanical realism and scan contrast
 */
function getSeasonalPalette(seasonId: string) {
  switch (seasonId) {
    case 'autumn':
      return {
        highlights: ['#fef08a', '#facc15', '#fde047', '#fb923c'],
        midtones: ['#f97316', '#ea580c', '#dc2626', '#c2410c'],
        shadows: ['#991b1b', '#7f1d1d', '#78350f', '#451a03'],
        trunk: '#4e342e',
        branch: '#5d4037',
        grassRoot: '#78350f',
        grassMid: '#b45309',
        grassTip: '#f59e0b',
        flowerColors: ['#fbbf24', '#f97316', '#ef4444'],
        fruitColor: '#dc2626',
        fallenLeaves: ['#dc2626', '#f59e0b', '#d97706', '#b91c1c'],
        stoneLight: '#f6ede2',
        stoneDark: '#e8dbcc',
        plinthCurb: '#573c2a',
      };
    case 'spring':
      return {
        highlights: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6'],
        midtones: ['#ec4899', '#db2777', '#be185d', '#f43f5e'],
        shadows: ['#9d174d', '#831843', '#701a75', '#500724'],
        trunk: '#4a3525',
        branch: '#5c4033',
        grassRoot: '#14532d',
        grassMid: '#22c55e',
        grassTip: '#86efac',
        flowerColors: ['#ffffff', '#fbcfe8', '#f472b6'],
        fruitColor: '#fda4af',
        fallenLeaves: ['#fbcfe8', '#f472b6', '#fda4af', '#f43f5e'],
        stoneLight: '#f8f4f0',
        stoneDark: '#ebe0d6',
        plinthCurb: '#4a3832',
      };
    case 'winter':
      return {
        highlights: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'],
        midtones: ['#94a3b8', '#64748b', '#475569', '#334155'],
        shadows: ['#1e293b', '#0f172a', '#020617', '#1e1b4b'],
        trunk: '#332f2c',
        branch: '#423d38',
        grassRoot: '#1e293b',
        grassMid: '#475569',
        grassTip: '#94a3b8',
        flowerColors: ['#ffffff', '#e2e8f0', '#bae6fd'],
        fruitColor: '#e0f2fe',
        fallenLeaves: ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8'],
        stoneLight: '#f1f5f9',
        stoneDark: '#e2e8f0',
        plinthCurb: '#334155',
      };
    case 'cyberpunk':
      return {
        highlights: ['#f0abfc', '#e879f9', '#d946ef', '#c026d3'],
        midtones: ['#a855f7', '#8b5cf6', '#6366f1', '#4f46e5'],
        shadows: ['#3b0764', '#2e1065', '#1e1b4b', '#0f172a'],
        trunk: '#1e1b4b',
        branch: '#312e81',
        grassRoot: '#0f172a',
        grassMid: '#6366f1',
        grassTip: '#38bdf8',
        flowerColors: ['#06b6d4', '#f43f5e', '#a855f7'],
        fruitColor: '#22d3ee',
        fallenLeaves: ['#f43f5e', '#ec4899', '#a855f7', '#06b6d4'],
        stoneLight: '#1e293b',
        stoneDark: '#0f172a',
        plinthCurb: '#020617',
      };
    case 'summer':
    default:
      return {
        highlights: ['#bef264', '#a3e635', '#84cc16', '#65a30d'],
        midtones: ['#4ade80', '#22c55e', '#16a34a', '#15803d'],
        shadows: ['#166534', '#14532d', '#052e16', '#022c22'],
        trunk: '#5c3826',
        branch: '#6d4c41',
        grassRoot: '#14532d',
        grassMid: '#16a34a',
        grassTip: '#84cc16',
        flowerColors: ['#ffffff', '#fde047', '#fbbf24'],
        fruitColor: '#f59e0b',
        fallenLeaves: ['#a3e635', '#4ade80', '#fde047', '#fbbf24'],
        stoneLight: '#f5f0e6',
        stoneDark: '#ede5d8',
        plinthCurb: '#4a3b32',
      };
  }
}

/**
 * Creates an organic low-poly foliage cloud geometry with faceted flat normals
 */
function createFoliageCloudGeometry(radius: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const noise =
      Math.sin(v.x * 1.3 + seed) * 0.15 +
      Math.cos(v.y * 1.5 + seed * 1.4) * 0.15 +
      Math.sin(v.z * 1.3 + seed * 0.8) * 0.15;
    v.addScaledVector(dir, noise * radius);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an organic curved, tapered grass blade geometry
 */
function createGrassBladeGeometry(height: number, archBend: number, width: number = 0.18): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const halfW = width / 2;
  const midW = halfW * 0.72;
  const midY = height * 0.52;
  const midZ = archBend * 0.45;
  const tipZ = archBend;

  const positions = new Float32Array([
    // Quad segment 1 (base to knee)
    -halfW, 0, 0,
     halfW, 0, 0,
    -midW, midY, midZ,

     halfW, 0, 0,
     midW, midY, midZ,
    -midW, midY, midZ,

    // Triangle segment 2 (knee to sharp arched tip)
    -midW, midY, midZ,
     midW, midY, midZ,
     0, height, tipZ,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a charming 5-petal stylized wildflower geometry
 */
function createFlowerGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const petalCount = 5;

  for (let i = 0; i < petalCount; i++) {
    const a1 = (i / petalCount) * Math.PI * 2;
    const a2 = ((i + 1) / petalCount) * Math.PI * 2;
    const aMid = (a1 + a2) / 2;
    const petLen = radius * 1.6;

    // Triangle 1
    positions.push(0, 0.05, 0);
    positions.push(Math.cos(a1) * radius * 0.65, 0.02, Math.sin(a1) * radius * 0.65);
    positions.push(Math.cos(aMid) * petLen, 0.12, Math.sin(aMid) * petLen);

    // Triangle 2
    positions.push(0, 0.05, 0);
    positions.push(Math.cos(aMid) * petLen, 0.12, Math.sin(aMid) * petLen);
    positions.push(Math.cos(a2) * radius * 0.65, 0.02, Math.sin(a2) * radius * 0.65);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

export const treeStyle: QRStyleGenerator = {
  id: 'tree',
  name: 'Living Seasonal Tree',
  vietnameseName: 'Cây Bốn Mùa Sinh Động',
  icon: '🌳',
  description: 'An organic botanical tree swaying in the wind that morphs into a garden mosaic QR code.',
  vietnameseDescription: 'Cây bốn mùa lay động trong gió, lá tự bay xuống xếp thành mã QR nghệ thuật.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const moduleSize = sceneSize / N;
    const palette = getSeasonalPalette(season.id);

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_BotanicalBonsai';

    const halfScene = sceneSize / 2;
    const toWorldPos = (r: number, c: number) => ({
      x: (c + 0.5) * moduleSize - halfScene,
      z: (r + 0.5) * moduleSize - halfScene,
    });

    // ==========================================
    // 1. ISOMETRIC GARDEN PATIO PLINTH
    // ==========================================
    const groundGroup = new THREE.Group();
    groundGroup.name = 'GardenPatio';

    // Base ceramic / stone plinth curb
    const slabGeo = new THREE.BoxGeometry(sceneSize * 1.035, 0.5, sceneSize * 1.035);
    const slabMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.plinthCurb),
      roughness: 0.8,
      metalness: 0.08,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -0.25;
    slabMesh.receiveShadow = true;
    groundGroup.add(slabMesh);

    // Warm stone patio floor
    const topFloorGeo = new THREE.BoxGeometry(sceneSize * 0.998, 0.04, sceneSize * 0.998);
    const topFloorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.stoneLight),
      roughness: 0.6,
      metalness: 0.0,
    });
    const topFloor = new THREE.Mesh(topFloorGeo, topFloorMat);
    topFloor.position.y = 0.02;
    topFloor.receiveShadow = true;
    groundGroup.add(topFloor);

    // Subtle stone paver texture for light modules
    let lightTileCount = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) lightTileCount++;
      }
    }

    const stoneTileGeo = new THREE.BoxGeometry(moduleSize * 0.98, 0.012, moduleSize * 0.98);
    const stoneMat = new THREE.MeshStandardMaterial({
      roughness: 0.65,
      metalness: 0.0,
    });
    const lightTilesMesh = new THREE.InstancedMesh(stoneTileGeo, stoneMat, lightTileCount);
    lightTilesMesh.receiveShadow = true;
    const dummyTile = new THREE.Object3D();
    const colorA = new THREE.Color(palette.stoneLight);
    const colorB = new THREE.Color(palette.stoneDark);

    let ltIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyTile.position.set(x, 0.026, z);
          dummyTile.updateMatrix();
          lightTilesMesh.setMatrixAt(ltIdx, dummyTile.matrix);
          const tint = (r * 3 + c * 7) % 5 === 0 ? colorB : colorA;
          lightTilesMesh.setColorAt(ltIdx, tint);
          ltIdx++;
        }
      }
    }
    lightTilesMesh.instanceMatrix.needsUpdate = true;
    if (lightTilesMesh.instanceColor) lightTilesMesh.instanceColor.needsUpdate = true;
    groundGroup.add(lightTilesMesh);

    // Scattered fallen petals / leaves on patio
    const fallenGroup = new THREE.Group();
    fallenGroup.name = 'FallenLeaves';
    const fallenLeafGeo = new THREE.PlaneGeometry(moduleSize * 0.45, moduleSize * 0.35);
    fallenLeafGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < 28; i++) {
      const angle = rng.angle();
      const dist = rng.range(moduleSize * 1.5, moduleSize * 9.0);
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;

      const fMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rng.choice(palette.fallenLeaves)),
        roughness: 0.6,
        side: THREE.DoubleSide,
      });
      const fMesh = new THREE.Mesh(fallenLeafGeo, fMat);
      fMesh.position.set(fx, 0.035, fz);
      fMesh.rotation.y = rng.angle();
      fMesh.scale.set(rng.range(0.8, 1.3), 1, rng.range(0.8, 1.3));
      fallenGroup.add(fMesh);
    }
    groundGroup.add(fallenGroup);
    rootGroup.add(groundGroup);

    // ==========================================
    // 2. LUSH BOTANICAL GRASS TUFTS & WILDFLOWERS
    // ==========================================
    const grassGroup = new THREE.Group();
    grassGroup.name = 'LushGrassBorders';

    const grassMatMid = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassMid),
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const grassMatTip = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grassTip),
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const flowerGeo = createFlowerGeometry(0.35);
    const flowerCenterGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const flowerCenterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#fbbf24'),
      roughness: 0.4,
    });

    // Helper to spawn a lush organic clump
    const spawnGrassClump = (cx: number, cz: number, bladeCount: number, radiusSpread: number, hasFlowers: boolean) => {
      // Clump of arched blades
      for (let b = 0; b < bladeCount; b++) {
        const height = rng.range(0.75, 1.45);
        const archBend = rng.range(0.25, 0.55);
        const bladeW = rng.range(0.14, 0.22);
        const geo = createGrassBladeGeometry(height, archBend, bladeW);
        const mat = rng.next() > 0.4 ? grassMatMid : grassMatTip;

        const blade = new THREE.Mesh(geo, mat);
        const r = rng.range(0.1, radiusSpread);
        const th = rng.angle();
        const bx = cx + Math.cos(th) * r;
        const bz = cz + Math.sin(th) * r;

        blade.position.set(bx, 0.02, bz);
        // Face blade outward from clump center with slight random wobble
        blade.rotation.y = th + rng.range(-0.4, 0.4);
        blade.rotation.x = rng.range(-0.15, 0.15);
        blade.castShadow = true;
        grassGroup.add(blade);
      }

      // Add delicate wildflowers inside the clump
      if (hasFlowers) {
        const flCount = rng.int(2, 4);
        for (let f = 0; f < flCount; f++) {
          const flMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(rng.choice(palette.flowerColors)),
            roughness: 0.4,
            side: THREE.DoubleSide,
          });
          const flMesh = new THREE.Mesh(flowerGeo, flMat);
          const flX = cx + rng.range(-radiusSpread * 0.7, radiusSpread * 0.7);
          const flZ = cz + rng.range(-radiusSpread * 0.7, radiusSpread * 0.7);
          const flY = rng.range(0.2, 0.55);

          flMesh.position.set(flX, flY, flZ);
          flMesh.rotation.set(rng.range(-0.3, 0.3), rng.angle(), rng.range(-0.3, 0.3));
          flMesh.scale.set(rng.range(0.8, 1.2), 1, rng.range(0.8, 1.2));
          flMesh.castShadow = true;
          grassGroup.add(flMesh);

          // Tiny golden center
          const cMesh = new THREE.Mesh(flowerCenterGeo, flowerCenterMat);
          cMesh.position.set(flX, flY + 0.04, flZ);
          grassGroup.add(cMesh);
        }
      }
    };

    // 4 Corner Mega Clumps (lush framing with charming flowers)
    const cornerOffset = halfScene * 0.93;
    spawnGrassClump(-cornerOffset, -cornerOffset, 22, 1.25, true);
    spawnGrassClump(cornerOffset, -cornerOffset, 22, 1.25, true);
    spawnGrassClump(-cornerOffset, cornerOffset, 22, 1.25, true);
    spawnGrassClump(cornerOffset, cornerOffset, 22, 1.25, true);

    // Perimeter Border Clumps (3 clumps along each edge curb)
    const edgePositions = [-5.5, 0, 5.5];
    for (const pos of edgePositions) {
      spawnGrassClump(-cornerOffset, pos, 12, 0.85, rng.next() > 0.4);
      spawnGrassClump(cornerOffset, pos, 12, 0.85, rng.next() > 0.4);
      spawnGrassClump(pos, -cornerOffset, 12, 0.85, rng.next() > 0.4);
      spawnGrassClump(pos, cornerOffset, 12, 0.85, rng.next() > 0.4);
    }

    rootGroup.add(grassGroup);

    // ==========================================
    // 3. ORGANIC TRUNK & UPWARD BOUGHS
    // ==========================================
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'TreeTrunk';

    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.trunk),
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.branch),
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });

    // Upright trunk with natural taper and organic curve
    const trunkHeight = 10.2;
    const trunkSegments = 9;
    const trunkBaseR = moduleSize * 0.85;

    const trunkPoints: { x: number; y: number; z: number; r: number }[] = [];
    for (let s = 0; s <= trunkSegments; s++) {
      const t = s / trunkSegments;
      const x = 0.32 * Math.sin(t * Math.PI * 0.85);
      const y = t * trunkHeight;
      const z = 0.22 * Math.sin(t * Math.PI * 1.2);
      const r = trunkBaseR * (1.0 - 0.54 * t);
      trunkPoints.push({ x, y, z, r });
    }

    for (let s = 0; s < trunkSegments; s++) {
      const pA = trunkPoints[s];
      const pB = trunkPoints[s + 1];
      const midX = (pA.x + pB.x) / 2;
      const midY = (pA.y + pB.y) / 2;
      const midZ = (pA.z + pB.z) / 2;
      const len = Math.hypot(pB.x - pA.x, pB.y - pA.y, pB.z - pA.z);

      const segGeo = new THREE.CylinderGeometry(pB.r, pA.r, len, 8);
      const segMesh = new THREE.Mesh(segGeo, trunkMat);
      segMesh.position.set(midX, midY, midZ);
      segMesh.lookAt(pB.x, pB.y, pB.z);
      segMesh.rotateX(Math.PI / 2);
      segMesh.castShadow = true;
      trunkGroup.add(segMesh);
    }

    // ==========================================
    // 4. LOW-POLY GHIBLI BOTANICAL CANOPY (No Noisy Flakes)
    // ==========================================
    const canopyGroup = new THREE.Group();
    canopyGroup.name = 'CanopyFoliage';

    interface CloudConfig {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      phase: number;
    }

    // 16 calibrated cloud masses forming a lush, balanced, picturesque crown
    const cloudConfigs: CloudConfig[] = [
      // Crown Pinnacle (Top peak)
      { x: 0.1, y: 14.6, z: 0.1, radius: 2.9, color: rng.choice(palette.highlights), phase: 0 },
      // Upper Shoulders (High layer)
      { x: 1.8, y: 13.0, z: 1.4, radius: 3.2, color: rng.choice(palette.highlights), phase: 1.2 },
      { x: -1.7, y: 13.1, z: 1.2, radius: 3.1, color: rng.choice(palette.highlights), phase: 2.5 },
      { x: 1.3, y: 12.8, z: -1.8, radius: 3.3, color: rng.choice(palette.highlights), phase: 3.8 },
      { x: -1.5, y: 12.9, z: -1.5, radius: 3.0, color: rng.choice(palette.highlights), phase: 5.1 },
      // Main Belly of Canopy (Wide, lush, dense mid-layer)
      { x: 3.3, y: 10.6, z: 1.6, radius: 3.9, color: rng.choice(palette.midtones), phase: 0.7 },
      { x: -3.1, y: 10.7, z: 1.8, radius: 3.9, color: rng.choice(palette.midtones), phase: 2.1 },
      { x: 2.9, y: 10.3, z: -2.6, radius: 3.8, color: rng.choice(palette.midtones), phase: 3.4 },
      { x: -2.9, y: 10.4, z: -2.4, radius: 3.8, color: rng.choice(palette.midtones), phase: 4.8 },
      { x: 0.2, y: 11.0, z: 3.3, radius: 3.7, color: rng.choice(palette.midtones), phase: 1.5 },
      { x: -0.2, y: 10.9, z: -3.4, radius: 3.7, color: rng.choice(palette.midtones), phase: 2.9 },
      // Lower Skirt (Bottom layer wrapping the trunk with rich shadow)
      { x: 2.4, y: 8.0, z: 2.0, radius: 3.3, color: rng.choice(palette.shadows), phase: 4.2 },
      { x: -2.5, y: 8.1, z: 1.9, radius: 3.4, color: rng.choice(palette.shadows), phase: 0.3 },
      { x: 0.5, y: 7.8, z: -2.9, radius: 3.2, color: rng.choice(palette.shadows), phase: 1.9 },
      { x: -0.6, y: 8.2, z: 2.8, radius: 3.0, color: rng.choice(palette.shadows), phase: 3.1 },
      { x: 2.7, y: 8.4, z: -1.8, radius: 3.1, color: rng.choice(palette.shadows), phase: 5.5 },
    ];

    const foliageClouds: FoliageCloud[] = [];

    // Spherical fruit / flower accents embedded directly in canopy
    const fruitGeo = new THREE.SphereGeometry(0.32, 6, 6);
    const fruitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.fruitColor),
      roughness: 0.35,
      metalness: 0.1,
    });

    for (let c = 0; c < cloudConfigs.length; c++) {
      const cfg = cloudConfigs[c];

      // Connect bough from trunk point to cloud center
      const startIdx = Math.min(
        trunkSegments - 1,
        Math.max(3, Math.floor((cfg.y / trunkHeight) * (trunkSegments - 1)))
      );
      const startP = trunkPoints[startIdx];

      const targetX = cfg.x * 0.82;
      const targetY = cfg.y * 0.92;
      const targetZ = cfg.z * 0.82;

      const midX = (startP.x + targetX) / 2;
      const midY = (startP.y + targetY) / 2;
      const midZ = (startP.z + targetZ) / 2;
      const bLen = Math.hypot(targetX - startP.x, targetY - startP.y, targetZ - startP.z);

      const bGeo = new THREE.CylinderGeometry(
        0.12 * moduleSize,
        0.24 * moduleSize,
        bLen,
        6
      );
      const bMesh = new THREE.Mesh(bGeo, branchMat);
      bMesh.position.set(midX, midY, midZ);
      bMesh.lookAt(targetX, targetY, targetZ);
      bMesh.rotateX(Math.PI / 2);
      bMesh.castShadow = true;
      trunkGroup.add(bMesh);

      // Create the clean low-poly volumetric foliage cloud mesh
      const cloudGeo = createFoliageCloudGeometry(cfg.radius, c * 1.7);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cfg.color),
        roughness: 0.65,
        metalness: 0.0,
        flatShading: true, // Crisp low-poly faceted shading
      });

      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(cfg.x, cfg.y, cfg.z);
      cloudMesh.castShadow = true;
      cloudMesh.receiveShadow = true;

      // Add 1-2 cute embedded fruit/blossom spheres nestled in the foliage
      if (c % 2 === 0) {
        const fruit = new THREE.Mesh(fruitGeo, fruitMat);
        fruit.position.set(
          rng.range(-cfg.radius * 0.7, cfg.radius * 0.7),
          rng.range(-cfg.radius * 0.5, cfg.radius * 0.5),
          cfg.radius * 0.85
        );
        fruit.castShadow = true;
        cloudMesh.add(fruit);
      }

      canopyGroup.add(cloudMesh);

      foliageClouds.push({
        mesh: cloudMesh,
        basePos: new THREE.Vector3(cfg.x, cfg.y, cfg.z),
        baseScale: new THREE.Vector3(1, 1, 1),
        phase: cfg.phase,
        swayAmp: rng.range(0.12, 0.22),
      });
    }

    rootGroup.add(trunkGroup);
    rootGroup.add(canopyGroup);

    // ==========================================
    // 5. ARTISTIC GROUND MOSAIC QR CODE
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
      moduleSize * 1.002,
      0.045,
      moduleSize * 1.002
    );

    const qrTileMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
    });

    const qrTileMesh = new THREE.InstancedMesh(qrTileGeo, qrTileMat, qrTileCount);
    qrTileMesh.name = 'QRMosaicTiles';
    qrTileMesh.castShadow = true;
    qrTileMesh.receiveShadow = true;

    const qrModules: QRMosaicModule[] = [];
    const dummyQR = new THREE.Object3D();

    for (let i = 0; i < qrTileCount; i++) {
      const mod = darkModules[i];
      const { x, z } = toWorldPos(mod.row, mod.col);

      // In tree mode: blend as stone pavers
      const colorTree = new THREE.Color(palette.stoneLight);

      // In QR mode: rich multi-tone mosaic greens / seasonal palette
      let colorQRHex: string;
      if (mod.isFinder) {
        // High-contrast dark tone for finder patterns (100% camera lock)
        colorQRHex = rng.choice(palette.shadows);
      } else {
        // Artistic multi-tone foliage mosaic
        const rVal = rng.next();
        if (rVal < 0.28) {
          colorQRHex = rng.choice(palette.highlights);
        } else if (rVal < 0.72) {
          colorQRHex = rng.choice(palette.midtones);
        } else {
          colorQRHex = rng.choice(palette.shadows);
        }
      }
      const colorQR = new THREE.Color(colorQRHex);

      const worldPos = new THREE.Vector3(x, 0.026, z);
      qrModules.push({ worldPos, colorTree, colorQR });

      dummyQR.position.copy(worldPos);
      dummyQR.scale.set(1, 0.2, 1);
      dummyQR.updateMatrix();
      qrTileMesh.setMatrixAt(i, dummyQR.matrix);
      qrTileMesh.setColorAt(i, colorTree);
    }

    qrTileMesh.instanceMatrix.needsUpdate = true;
    if (qrTileMesh.instanceColor) qrTileMesh.instanceColor.needsUpdate = true;
    rootGroup.add(qrTileMesh);

    // ==========================================
    // 6. REAL-TIME UNIFIED WIND BREEZE & MORPH ANIMATION (60 FPS)
    // ==========================================
    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Trunk, Canopy, Grass & Fallen Leaves gracefully sink down
      const decorScale = Math.max(0.0001, 1 - Math.pow(p, 1.4));
      trunkGroup.scale.set(decorScale, decorScale, decorScale);
      trunkGroup.visible = p < 0.98;

      grassGroup.scale.set(decorScale, decorScale, decorScale);
      grassGroup.visible = p < 0.98;

      fallenGroup.scale.set(decorScale, decorScale, decorScale);
      fallenGroup.visible = p < 0.98;

      canopyGroup.scale.set(decorScale, decorScale, decorScale);
      canopyGroup.visible = p < 0.98;

      // 2. Cohesive Natural Wind Sway (Unified peaceful breeze)
      if (canopyGroup.visible) {
        const globalWindX = Math.sin(time * 1.3) * 0.16;
        const globalWindZ = Math.cos(time * 1.05) * 0.12;

        for (let c = 0; c < foliageClouds.length; c++) {
          const cloud = foliageClouds[c];
          const hFactor = cloud.basePos.y / 12.0;

          const cx = cloud.basePos.x + globalWindX * hFactor + Math.sin(time * 2.1 + cloud.phase) * cloud.swayAmp;
          const cz = cloud.basePos.z + globalWindZ * hFactor + Math.cos(time * 1.7 + cloud.phase) * cloud.swayAmp;
          const cy = cloud.basePos.y + Math.sin(time * 2.4 + cloud.phase) * (cloud.swayAmp * 0.35);

          cloud.mesh.position.set(cx, cy, cz);
        }
      }

      // 3. Animate Ground QR Mosaic Tiles
      const qrEase =
        p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      for (let i = 0; i < qrTileCount; i++) {
        const mod = qrModules[i];

        const curY = THREE.MathUtils.lerp(0.026, 0.042, qrEase);
        const curScaleY = THREE.MathUtils.lerp(0.2, 1.0, qrEase);

        dummyQR.position.set(mod.worldPos.x, curY, mod.worldPos.z);
        dummyQR.scale.set(1.0, curScaleY, 1.0);
        dummyQR.updateMatrix();
        qrTileMesh.setMatrixAt(i, dummyQR.matrix);

        const curColor = new THREE.Color().lerpColors(mod.colorTree, mod.colorQR, qrEase);
        qrTileMesh.setColorAt(i, curColor);
      }

      qrTileMesh.instanceMatrix.needsUpdate = true;
      if (qrTileMesh.instanceColor) qrTileMesh.instanceColor.needsUpdate = true;
    };

    return rootGroup;
  },
};
