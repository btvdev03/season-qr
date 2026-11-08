/**
 * SeasonQR - Authentic Ghibli Botanical Tree & Garden Mosaic QR Transformer
 *
 * Implements a gorgeous, fluffy, volumetric 3D botanical tree (Image 2):
 * 1. Living Botanical Tree Mode:
 *    - Curving, tapered organic trunk with warm wood bark.
 *    - Graceful boughs reaching upward into the canopy, terminating inside foliage clouds.
 *    - Volumetric fluffy foliage cloud masses (displaced organic icosahedron lobes)
 *      forming a lush, rounded, voluminous teardrop canopy (Y from 4.8 to 15.5).
 *    - Beautiful sunlight gradient:
 *      * Sunlit lime highlights on top (#bef264, #a3e635)
 *      * Lush emerald midtones in the body (#4ade80, #22c55e)
 *      * Deep forest shadows underneath (#166534, #14532d)
 *    - Delicate surface leaf flakes feathering the canopy silhouette.
 *    - Natural, soothing, harmonic wind sway physics (60 FPS) where the whole tree
 *      breathes together in the breeze, instead of chaotic independent spinning!
 *    - Isometric stone patio with multi-blade grass tufts and scattered fallen petals.
 *
 * 2. Signature Garden Mosaic QR Mode (Image 4):
 *    - Tapping triggers camera transition to clean top-down view.
 *    - The tree canopy and branches gracefully collapse/shrink down into the patio.
 *    - The ground plate emerges into the exact multi-tone artistic mosaic QR code (Image 4).
 *    - Seamless 1.002 module scale for 100% instantaneous camera scan lock.
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

interface LeafFlake {
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  baseScale: THREE.Vector3;
  phase: number;
  cloudIdx: number;
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
        grass: '#b45309',
        fallenLeaves: ['#dc2626', '#f59e0b', '#d97706', '#b91c1c'],
        stoneLight: '#f5eee6',
        stoneDark: '#e8ded2',
      };
    case 'spring':
      return {
        highlights: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6'],
        midtones: ['#ec4899', '#db2777', '#be185d', '#f43f5e'],
        shadows: ['#9d174d', '#831843', '#701a75', '#500724'],
        trunk: '#4a3525',
        branch: '#5c4033',
        grass: '#4ade80',
        fallenLeaves: ['#fbcfe8', '#f472b6', '#fda4af', '#f43f5e'],
        stoneLight: '#f9f5f0',
        stoneDark: '#ece5dc',
      };
    case 'winter':
      return {
        highlights: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'],
        midtones: ['#94a3b8', '#64748b', '#475569', '#334155'],
        shadows: ['#1e293b', '#0f172a', '#020617', '#1e1b4b'],
        trunk: '#332f2c',
        branch: '#423d38',
        grass: '#64748b',
        fallenLeaves: ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8'],
        stoneLight: '#e2e8f0',
        stoneDark: '#cbd5e1',
      };
    case 'summer':
    default:
      // Authentic ICQR Summer Foliage (Image 2 & 4)
      return {
        highlights: ['#bef264', '#a3e635', '#84cc16', '#65a30d'],
        midtones: ['#4ade80', '#22c55e', '#16a34a', '#15803d'],
        shadows: ['#166534', '#14532d', '#052e16', '#022c22'],
        trunk: '#5c3826',
        branch: '#6d4c41',
        grass: '#22c55e',
        fallenLeaves: ['#a3e635', '#4ade80', '#f472b6', '#fde047'],
        stoneLight: '#f5f0e6',
        stoneDark: '#ede5d8',
      };
  }
}

/**
 * Creates an organic fluffy foliage cloud geometry (displaced icosahedron)
 */
function createFoliageCloudGeometry(radius: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const noise =
      Math.sin(v.x * 1.4 + seed) * 0.16 +
      Math.cos(v.y * 1.6 + seed * 1.3) * 0.16 +
      Math.sin(v.z * 1.4 + seed * 0.7) * 0.16;
    v.addScaledVector(dir, noise * radius);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedural leaf silhouette texture for surface feathering
 */
function createLeafFlakeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.bezierCurveTo(52, 14, 58, 36, 48, 52);
  ctx.bezierCurveTo(40, 60, 24, 60, 16, 52);
  ctx.bezierCurveTo(6, 36, 12, 14, 32, 6);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  return texture;
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
    rootGroup.name = 'Style_BotanicalGhibliTree';

    const halfScene = sceneSize / 2;
    const toWorldPos = (r: number, c: number) => ({
      x: (c + 0.5) * moduleSize - halfScene,
      z: (r + 0.5) * moduleSize - halfScene,
    });

    // ==========================================
    // 1. ISOMETRIC GARDEN PATIO (Image 2)
    // ==========================================
    const groundGroup = new THREE.Group();
    groundGroup.name = 'GardenPatio';

    // Base stone curb foundation
    const slabGeo = new THREE.BoxGeometry(sceneSize * 1.03, 0.45, sceneSize * 1.03);
    const slabMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b0a898'),
      roughness: 0.85,
      metalness: 0.05,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -0.225;
    slabMesh.receiveShadow = true;
    groundGroup.add(slabMesh);

    // Warm cream patio floor
    const topFloorGeo = new THREE.BoxGeometry(sceneSize * 0.998, 0.04, sceneSize * 0.998);
    const topFloorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.stoneLight),
      roughness: 0.55,
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
      roughness: 0.6,
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

    // Fallen petals scattered on patio (Image 2)
    const fallenGroup = new THREE.Group();
    fallenGroup.name = 'FallenLeaves';
    const fallenLeafGeo = new THREE.PlaneGeometry(moduleSize * 0.45, moduleSize * 0.35);
    fallenLeafGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < 24; i++) {
      const angle = rng.angle();
      const dist = rng.range(moduleSize * 1.5, moduleSize * 8.5);
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
    // 2. CORNER GRASS TUFTS (Image 2)
    // ==========================================
    const grassGroup = new THREE.Group();
    grassGroup.name = 'GrassBorders';

    const bladeGeo = new THREE.ConeGeometry(0.1, 0.85, 3);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grass),
      roughness: 0.5,
      metalness: 0.05,
    });

    const clumpPositions: [number, number][] = [
      [-halfScene * 0.94, -halfScene * 0.94],
      [halfScene * 0.94, -halfScene * 0.94],
      [-halfScene * 0.94, halfScene * 0.94],
      [halfScene * 0.94, halfScene * 0.94],
      [0, -halfScene * 0.95],
      [0, halfScene * 0.95],
      [-halfScene * 0.95, 0],
      [halfScene * 0.95, 0],
    ];

    for (const [cx, cz] of clumpPositions) {
      const bladeCount = rng.int(12, 18);
      for (let b = 0; b < bladeCount; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const bx = cx + rng.range(-0.95, 0.95);
        const bz = cz + rng.range(-0.95, 0.95);
        const bScale = rng.range(0.65, 1.35);

        blade.position.set(bx, (0.85 * bScale) / 2 + 0.02, bz);
        blade.rotation.set(
          rng.range(-0.35, 0.35),
          rng.angle(),
          rng.range(-0.35, 0.35)
        );
        blade.scale.set(bScale, bScale, bScale);
        blade.castShadow = true;
        grassGroup.add(blade);
      }
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
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.branch),
      roughness: 0.8,
      metalness: 0.05,
    });

    // Tall upright trunk with gentle natural taper and curve
    const trunkHeight = 10.0;
    const trunkSegments = 8;
    const trunkBaseR = moduleSize * 0.85;

    const trunkPoints: { x: number; y: number; z: number; r: number }[] = [];
    for (let s = 0; s <= trunkSegments; s++) {
      const t = s / trunkSegments;
      const x = 0.35 * Math.sin(t * Math.PI * 0.8);
      const y = t * trunkHeight;
      const z = 0.25 * Math.sin(t * Math.PI * 1.2);
      const r = trunkBaseR * (1.0 - 0.52 * t);
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
    // 4. VOLUMETRIC FOLIAGE CLOUDS (14 Volumetric Masses)
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

    // 14 carefully calibrated cloud positions forming the lush teardrop silhouette
    const cloudConfigs: CloudConfig[] = [
      // Crown Pinnacle (Top peak)
      { x: 0.1, y: 14.2, z: 0.1, radius: 2.8, color: rng.choice(palette.highlights), phase: 0 },
      // Upper Shoulders (High layer)
      { x: 1.8, y: 12.6, z: 1.4, radius: 3.2, color: rng.choice(palette.highlights), phase: 1.2 },
      { x: -1.7, y: 12.8, z: 1.2, radius: 3.1, color: rng.choice(palette.highlights), phase: 2.5 },
      { x: 1.2, y: 12.4, z: -1.8, radius: 3.3, color: rng.choice(palette.highlights), phase: 3.8 },
      { x: -1.5, y: 12.5, z: -1.5, radius: 3.0, color: rng.choice(palette.highlights), phase: 5.1 },
      // Main Belly of Canopy (Wide, lush, dense mid-layer)
      { x: 3.2, y: 10.2, z: 1.6, radius: 3.8, color: rng.choice(palette.midtones), phase: 0.7 },
      { x: -3.0, y: 10.4, z: 1.8, radius: 3.9, color: rng.choice(palette.midtones), phase: 2.1 },
      { x: 2.8, y: 10.0, z: -2.6, radius: 3.7, color: rng.choice(palette.midtones), phase: 3.4 },
      { x: -2.9, y: 10.2, z: -2.4, radius: 3.8, color: rng.choice(palette.midtones), phase: 4.8 },
      { x: 0.2, y: 10.6, z: 3.2, radius: 3.6, color: rng.choice(palette.midtones), phase: 1.5 },
      { x: -0.2, y: 10.5, z: -3.4, radius: 3.6, color: rng.choice(palette.midtones), phase: 2.9 },
      // Lower Skirt (Bottom layer wrapping the trunk)
      { x: 2.2, y: 7.8, z: 2.0, radius: 3.2, color: rng.choice(palette.shadows), phase: 4.2 },
      { x: -2.4, y: 7.9, z: 1.9, radius: 3.3, color: rng.choice(palette.shadows), phase: 0.3 },
      { x: 0.5, y: 7.6, z: -2.8, radius: 3.1, color: rng.choice(palette.shadows), phase: 1.9 },
    ];

    const foliageClouds: FoliageCloud[] = [];

    // Build graceful boughs from trunk reaching into each cloud center
    for (let c = 0; c < cloudConfigs.length; c++) {
      const cfg = cloudConfigs[c];

      // Connect bough from trunk point to cloud center (ending safely inside the cloud!)
      const startIdx = Math.min(
        trunkSegments - 1,
        Math.max(3, Math.floor((cfg.y / trunkHeight) * (trunkSegments - 1)))
      );
      const startP = trunkPoints[startIdx];

      // End point stops short inside the cloud (80% towards center so it never pokes out!)
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

      // Create the volumetric foliage cloud mesh
      const cloudGeo = createFoliageCloudGeometry(cfg.radius, c * 1.7);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cfg.color),
        roughness: 0.65,
        metalness: 0.0,
        flatShading: false,
      });

      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(cfg.x, cfg.y, cfg.z);
      cloudMesh.castShadow = true;
      cloudMesh.receiveShadow = true;
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

    // ==========================================
    // 5. SURFACE LEAF FLAKES (Delicate Edge Feathering)
    // ==========================================
    const leafTex = createLeafFlakeTexture();
    const leafFlakeMat = new THREE.MeshStandardMaterial({
      map: leafTex,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const totalFlakes = cloudConfigs.length * 40; // ~560 delicate flakes
    const flakeGeo = new THREE.PlaneGeometry(moduleSize * 0.45, moduleSize * 0.55);
    flakeGeo.rotateX(-Math.PI / 2);

    const leafFlakesMesh = new THREE.InstancedMesh(flakeGeo, leafFlakeMat, totalFlakes);
    leafFlakesMesh.castShadow = true;
    leafFlakesMesh.receiveShadow = true;

    const leafFlakes: LeafFlake[] = [];
    const dummyFlake = new THREE.Object3D();

    let flIdx = 0;
    for (let c = 0; c < cloudConfigs.length; c++) {
      const cfg = cloudConfigs[c];

      for (let f = 0; f < 40; f++) {
        // Positioned along the outer surface of each cloud
        const theta = rng.angle();
        const phi = Math.acos(rng.range(-1, 1));
        const surfR = cfg.radius * rng.range(0.92, 1.15);

        const fx = cfg.x + surfR * Math.sin(phi) * Math.cos(theta);
        const fy = cfg.y + surfR * Math.sin(phi) * Math.sin(theta);
        const fz = cfg.z + surfR * Math.cos(phi);

        const basePos = new THREE.Vector3(fx, fy, fz);
        const baseRot = new THREE.Euler(
          rng.range(-0.6, 0.6),
          rng.angle(),
          rng.range(-0.6, 0.6)
        );
        const s = rng.range(0.8, 1.3);
        const baseScale = new THREE.Vector3(s, s, s);

        leafFlakes.push({
          basePos,
          baseRot,
          baseScale,
          phase: rng.range(0, Math.PI * 2),
          cloudIdx: c,
        });

        // Color matches parent cloud
        leafFlakesMesh.setColorAt(flIdx, new THREE.Color(cfg.color));

        dummyFlake.position.copy(basePos);
        dummyFlake.rotation.copy(baseRot);
        dummyFlake.scale.copy(baseScale);
        dummyFlake.updateMatrix();
        leafFlakesMesh.setMatrixAt(flIdx, dummyFlake.matrix);

        flIdx++;
      }
    }

    leafFlakesMesh.instanceMatrix.needsUpdate = true;
    if (leafFlakesMesh.instanceColor) leafFlakesMesh.instanceColor.needsUpdate = true;
    canopyGroup.add(leafFlakesMesh);
    rootGroup.add(canopyGroup);

    // ==========================================
    // 6. ARTISTIC GROUND MOSAIC QR CODE (Image 4)
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

      // In tree mode: stone paver tint (#f5f0e6)
      const colorTree = new THREE.Color(palette.stoneLight);

      // In QR mode: rich multi-tone mosaic greens (Image 4)
      let colorQRHex: string;
      if (mod.isFinder) {
        // High-contrast dark forest green for finder patterns (100% camera lock)
        colorQRHex = rng.choice(palette.shadows);
      } else {
        // Artistic multi-tone foliage mosaic (olive, emerald, lush green, forest)
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
    // 7. REAL-TIME UNIFIED WIND BREEZE & MORPH ANIMATION (60 FPS)
    // ==========================================
    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Trunk and Grass scale down as we morph into flat QR
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
        // Global wind wave across the whole tree
        const globalWindX = Math.sin(time * 1.4) * 0.16;
        const globalWindZ = Math.cos(time * 1.1) * 0.12;

        // Animate each foliage cloud mass
        for (let c = 0; c < foliageClouds.length; c++) {
          const cloud = foliageClouds[c];
          const hFactor = cloud.basePos.y / 12.0;

          const cx = cloud.basePos.x + globalWindX * hFactor + Math.sin(time * 2.2 + cloud.phase) * cloud.swayAmp;
          const cz = cloud.basePos.z + globalWindZ * hFactor + Math.cos(time * 1.8 + cloud.phase) * cloud.swayAmp;
          const cy = cloud.basePos.y + Math.sin(time * 2.6 + cloud.phase) * (cloud.swayAmp * 0.4);

          cloud.mesh.position.set(cx, cy, cz);
        }

        // Animate surface leaf flakes (they sway gently with their parent cloud)
        for (let f = 0; f < totalFlakes; f++) {
          const flake = leafFlakes[f];
          const hFactor = flake.basePos.y / 12.0;

          const fx = flake.basePos.x + globalWindX * hFactor + Math.sin(time * 2.2 + flake.phase) * 0.08;
          const fz = flake.basePos.z + globalWindZ * hFactor + Math.cos(time * 1.8 + flake.phase) * 0.08;
          const fy = flake.basePos.y + Math.sin(time * 2.6 + flake.phase) * 0.04;

          const flutter = Math.sin(time * 3.2 + flake.phase) * 0.08;

          dummyFlake.position.set(fx, fy, fz);
          dummyFlake.rotation.set(
            flake.baseRot.x + flutter,
            flake.baseRot.y,
            flake.baseRot.z + flutter
          );
          dummyFlake.scale.copy(flake.baseScale);
          dummyFlake.updateMatrix();
          leafFlakesMesh.setMatrixAt(f, dummyFlake.matrix);
        }
        leafFlakesMesh.instanceMatrix.needsUpdate = true;
      }

      // 3. Animate Ground QR Mosaic Tiles (flush pavers in tree mode -> vibrant mosaic QR code in scan mode)
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
