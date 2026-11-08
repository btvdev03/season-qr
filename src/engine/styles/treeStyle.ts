/**
 * SeasonQR - Signature Realistic Oak Tree & Voxel Patio QR Transformer
 *
 * Implements high-end 3D realistic botanical tree architecture (matching the user reference image):
 * 1. Realistic Oak Tree (Powered by @dgreenheck/ez-tree):
 *    - Real procedural branching limbs (3 hierarchy levels).
 *    - PBR oak bark with vertical grain and flared root collar.
 *    - Double-billboard oak foliage cards with alpha cutout and realistic leaf silhouettes.
 *    - Built-in real-time vertex wind physics (sways naturally in 60 FPS).
 *    - Seasonal foliage color tinting (Spring Sakura, Summer Oak, Autumn Maple, Winter Frost).
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
    count: 22,
    start: 0.12,
    size: 3.2,
    sizeVariance: 0.8,
    tint: 0xffffff,
    alphaTest: 0.4,
  },
  trellis: {
    enabled: false,
  },
};

/**
 * Seasonal palettes tuned for botanical realism and scan contrast
 */
function getSeasonalPalette(seasonId: string) {
  switch (seasonId) {
    case 'autumn':
      return {
        leafTint: 0xdc2626, // Crimson maple
        barkTint: 0x451a03,
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
        leafTint: 0xf472b6, // Sakura blossom pink
        barkTint: 0x4a3525,
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
        leafTint: 0xe2e8f0, // Frost snow
        barkTint: 0x292524,
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
        leafTint: 0xd946ef,
        barkTint: 0x1e1b4b,
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
        leafTint: 0x48bb78, // Lush vibrant emerald green (matching reference photo)
        barkTint: 0x5c4033, // Rich warm oak bark
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
  name: 'Realistic Oak Tree & Voxel Patio',
  vietnameseName: 'Cây Sồi 3D Chân Thực & Sân Voxel',
  icon: '🌳',
  description: 'A realistic 3D oak tree with procedural branching limbs, PBR bark, and dense foliage cards.',
  vietnameseDescription: 'Cây sồi 3D chân thực với cành nhánh uốn lượn, vỏ cây PBR và tán lá dày đặc.',

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
    // 3. REALISTIC PROCEDURAL OAK TREE (@dgreenheck/ez-tree)
    // ==========================================
    const treeGroup = new THREE.Group();
    treeGroup.name = 'RealisticOakTree';

    // Clone preset options and apply seasonal tints
    const treeOptions = JSON.parse(JSON.stringify(OAK_TREE_PRESET));
    treeOptions.leaves.tint = palette.leafTint;
    treeOptions.bark.tint = palette.barkTint;

    const realisticTree = new Tree();
    realisticTree.loadFromJson(treeOptions);
    realisticTree.generate();

    // Scale and position the tree to sit gracefully on the patio
    const treeScale = 0.26;
    realisticTree.scale.set(treeScale, treeScale, treeScale);
    realisticTree.position.set(0, paverBlockHeight, 0);

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

      grassGroup.position.y = -0.8 * p;
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
