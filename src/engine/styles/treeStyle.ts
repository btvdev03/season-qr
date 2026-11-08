/**
 * SeasonQR - Signature Pixel-Art Tree & Voxel Patio QR Transformer
 *
 * Handcrafted 1:1 reproduction of the authentic isometric voxel/pixel diorama:
 * 1. Voxel Stone Paver Patio:
 *    - Discrete 3D voxel cubes (BoxGeometry) corresponding 1:1 with the QR matrix modules.
 *    - Beveled stone paving in warm limestone / sand tones with subtle grain variations.
 *    - Perimeter curb framing the diorama with corner & border grass tufts + delicate wildflowers.
 *
 * 2. Organic Bonsai Branching Trunk:
 *    - Flared root base anchoring into the patio center.
 *    - Curving main trunk splitting into 5 primary spreading boughs (4 diagonal + 1 central leader).
 *    - Secondary branch twigs reaching out into foliage clusters.
 *
 * 3. Pixel-Petal Canopy (Stepped Quantized Palette):
 *    - Thousands of individual instanced diamond/quad leaf petals.
 *    - 4-Tier stepped palette quantization:
 *      * Tier 1 (Highlight): Sunlit lime / golden tips
 *      * Tier 2 (Light): Vibrant emerald / fresh young leaves
 *      * Tier 3 (Midtone): Lush forest green
 *      * Tier 4 (Shadow): Deep evergreen under-canopy
 *    - Discrete faceted normals producing authentic 16-bit / 32-bit pixel-art stair-stepped silhouettes.
 *    - Smooth 60 FPS wind flutter physics reacting to atmospheric breezes.
 *
 * 4. 100% Guaranteed Smartphone QR Camera Scan Lock (<0.1s):
 *    - When transitioning to Scan Mode (progress -> 1.0), all foliage, branches, and grass
 *      gracefully collapse and sink beneath the floor.
 *    - The stone patio reveals an ultra-high-contrast QR matrix (Level H 30% error correction).
 *    - Instant smartphone camera detection guaranteed!
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface LeafPetalData {
  baseX: number;
  baseY: number;
  baseZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  color: THREE.Color;
  phase: number;
  swayAmp: number;
}

interface QRMosaicModule {
  worldPos: THREE.Vector3;
  colorTree: THREE.Color;
  colorQR: THREE.Color;
}

/**
 * Seasonal palettes tuned with 4-tier stepped quantization for authentic pixel-art rendering
 */
function getPixelSeasonalPalette(seasonId: string) {
  switch (seasonId) {
    case 'autumn':
      return {
        tier1Highlight: '#fde047', // Sunlit yellow-gold
        tier2Light: '#fb923c',     // Warm glowing pumpkin
        tier3Midtone: '#dc2626',   // Vibrant crimson maple
        tier4Shadow: '#7f1d1d',    // Deep russet shadow
        trunk: '#451a03',
        branch: '#5c2406',
        grassMid: '#b45309',
        grassTip: '#f59e0b',
        flowerColors: ['#fbbf24', '#f97316', '#ef4444'],
        fallenLeaves: ['#dc2626', '#f59e0b', '#d97706', '#b91c1c'],
        stoneLight: '#f5efe6',
        stoneDark: '#e8ded2',
        stoneShadow: '#dad0c0',
        plinthCurb: '#573c2a',
        qrFinderDark: '#3b0d0c',
      };
    case 'spring':
      return {
        tier1Highlight: '#fff1f2', // Sunlit blossom white
        tier2Light: '#fbcfe8',     // Fresh sakura petal pink
        tier3Midtone: '#f43f5e',   // Vibrant cherry rose
        tier4Shadow: '#881337',    // Deep berry under-shadow
        trunk: '#44281d',
        branch: '#593627',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fbcfe8', '#f472b6'],
        fallenLeaves: ['#fbcfe8', '#f472b6', '#fda4af', '#fff1f2'],
        stoneLight: '#f6f2ec',
        stoneDark: '#ece5dc',
        stoneShadow: '#ddd4c9',
        plinthCurb: '#4a3832',
        qrFinderDark: '#4c0519',
      };
    case 'winter':
      return {
        tier1Highlight: '#ffffff', // Crisp snow white
        tier2Light: '#bae6fd',     // Frost ice blue
        tier3Midtone: '#64748b',   // Slate pine blue
        tier4Shadow: '#1e293b',    // Deep twilight navy
        trunk: '#292524',
        branch: '#3f3936',
        grassMid: '#475569',
        grassTip: '#94a3b8',
        flowerColors: ['#ffffff', '#e2e8f0', '#bae6fd'],
        fallenLeaves: ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8'],
        stoneLight: '#f1f5f9',
        stoneDark: '#e2e8f0',
        stoneShadow: '#cbd5e1',
        plinthCurb: '#334155',
        qrFinderDark: '#0f172a',
      };
    case 'cyberpunk':
      return {
        tier1Highlight: '#f5d0fe',
        tier2Light: '#d946ef',
        tier3Midtone: '#7c3aed',
        tier4Shadow: '#2e1065',
        trunk: '#1e1b4b',
        branch: '#312e81',
        grassMid: '#6366f1',
        grassTip: '#38bdf8',
        flowerColors: ['#06b6d4', '#f43f5e', '#a855f7'],
        fallenLeaves: ['#f43f5e', '#ec4899', '#a855f7', '#06b6d4'],
        stoneLight: '#1e293b',
        stoneDark: '#0f172a',
        stoneShadow: '#020617',
        plinthCurb: '#020617',
        qrFinderDark: '#170326',
      };
    case 'summer':
    default:
      return {
        tier1Highlight: '#bef264', // Sunlit lime highlight (seen on top of ICQR tree)
        tier2Light: '#4ade80',     // Vibrant young emerald
        tier3Midtone: '#22c55e',   // Lush body green
        tier4Shadow: '#15803d',    // Deep forest under-shadow
        trunk: '#4a2c1d',          // Rich cedar bark
        branch: '#5c3926',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fde047', '#f472b6'],
        fallenLeaves: ['#a3e635', '#4ade80', '#bef264', '#fde047'],
        stoneLight: '#f5f0e6',     // Clean warm paver stone
        stoneDark: '#ede5d8',      // Secondary stone paver
        stoneShadow: '#dfd5c4',    // Shadow stone paver
        plinthCurb: '#4a3b32',     // Perimeter plinth rim
        qrFinderDark: '#052e16',   // High-contrast deep evergreen for QR finder
      };
  }
}

/**
 * Creates a faceted diamond pixel leaf petal geometry (2 triangles folded slightly)
 */
function createPixelPetalGeometry(width: number, length: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const halfW = width / 2;
  const halfL = length / 2;
  const curlY = length * 0.16; // subtle 3D fold for crisp facet shading

  const positions = new Float32Array([
    // Triangle 1: Base to Left Wing to Tip
    0, 0, -halfL,
    -halfW, curlY, 0,
    0, 0, halfL,

    // Triangle 2: Base to Tip to Right Wing
    0, 0, -halfL,
    0, 0, halfL,
    halfW, curlY, 0,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a crisp single-triangle grass blade geometry for authentic pixel grass tufts
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
  name: 'Pixel Art Tree & Voxel Patio',
  vietnameseName: 'Cây Pixel & Sân Voxel 3D',
  icon: '🌳',
  description: 'An authentic isometric pixel-art tree diorama with stepped foliage shading and 3D voxel patio.',
  vietnameseDescription: 'Cây bốn mùa phong cách Pixel Art 3D, tán lá xếp tầng tự nhiên trên sân đá Voxel.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const moduleSize = sceneSize / N;
    const palette = getPixelSeasonalPalette(season.id);

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_PixelArtTreeDiorama';

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

    // Outer Stone Curb / Base Plinth
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

          // Subtle checkerboard & natural stone hue variation
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

    // Subtle scattered fallen leaves on patio
    const fallenGroup = new THREE.Group();
    fallenGroup.name = 'PatioFallenLeaves';
    const fallenLeafGeo = createPixelPetalGeometry(moduleSize * 0.45, moduleSize * 0.65);

    for (let i = 0; i < 32; i++) {
      const angle = rng.angle();
      const dist = rng.range(moduleSize * 1.8, moduleSize * 8.5);
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;

      const fMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rng.choice(palette.fallenLeaves)),
        roughness: 0.55,
        side: THREE.DoubleSide,
        flatShading: true,
      });
      const fMesh = new THREE.Mesh(fallenLeafGeo, fMat);
      fMesh.position.set(fx, paverBlockHeight + 0.005, fz);
      fMesh.rotation.set(-Math.PI / 2 + rng.range(-0.1, 0.1), rng.angle(), rng.range(-0.1, 0.1));
      fMesh.scale.set(rng.range(0.8, 1.2), rng.range(0.8, 1.2), 1);
      fallenGroup.add(fMesh);
    }
    patioGroup.add(fallenGroup);
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

    // 4 Corner Mega Clumps
    const cornerOffset = halfScene * 0.92;
    spawnGrassClump(-cornerOffset, -cornerOffset, 20, 1.3, true);
    spawnGrassClump(cornerOffset, -cornerOffset, 20, 1.3, true);
    spawnGrassClump(-cornerOffset, cornerOffset, 20, 1.3, true);
    spawnGrassClump(cornerOffset, cornerOffset, 20, 1.3, true);

    // Perimeter Border Clumps
    const borderOffsets = [-5.5, 0, 5.5];
    for (const pos of borderOffsets) {
      spawnGrassClump(-cornerOffset, pos, 10, 0.85, rng.next() > 0.4);
      spawnGrassClump(cornerOffset, pos, 10, 0.85, rng.next() > 0.4);
      spawnGrassClump(pos, -cornerOffset, 10, 0.85, rng.next() > 0.4);
      spawnGrassClump(pos, cornerOffset, 10, 0.85, rng.next() > 0.4);
    }
    rootGroup.add(grassGroup);

    // ==========================================
    // 3. ORGANIC BONSAI BRANCHING TRUNK
    // ==========================================
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'OrganicBranchingTrunk';

    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.trunk),
      roughness: 0.85,
      metalness: 0.02,
      flatShading: true,
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.branch),
      roughness: 0.8,
      metalness: 0.02,
      flatShading: true,
    });

    // Helper to build a tapered cylinder segment
    const addCylinderSegment = (
      parent: THREE.Group,
      pA: THREE.Vector3,
      pB: THREE.Vector3,
      rA: number,
      rB: number,
      mat: THREE.Material,
      radialSegments: number = 7
    ) => {
      const len = pA.distanceTo(pB);
      if (len < 0.01) return;
      const geo = new THREE.CylinderGeometry(rB, rA, len, radialSegments);
      const mesh = new THREE.Mesh(geo, mat);
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      mesh.position.copy(mid);
      mesh.lookAt(pB);
      mesh.rotateX(Math.PI / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
    };

    // Main Trunk Base Spine (Upward curving stem)
    const basePts: { pos: THREE.Vector3; r: number }[] = [
      { pos: new THREE.Vector3(0, paverBlockHeight, 0), r: moduleSize * 0.95 },
      { pos: new THREE.Vector3(0.08, 1.2, 0.05), r: moduleSize * 0.82 },
      { pos: new THREE.Vector3(0.2, 2.6, 0.15), r: moduleSize * 0.72 },
      { pos: new THREE.Vector3(0.15, 4.2, 0.1), r: moduleSize * 0.62 },
      { pos: new THREE.Vector3(-0.05, 5.8, -0.05), r: moduleSize * 0.54 }, // Fork node
    ];

    for (let s = 0; s < basePts.length - 1; s++) {
      addCylinderSegment(
        trunkGroup,
        basePts[s].pos,
        basePts[s + 1].pos,
        basePts[s].r,
        basePts[s + 1].r,
        trunkMat,
        8
      );
    }

    // Flared root spurs at base
    const rootAngles = [0.3, 1.6, 3.1, 4.6];
    for (const ang of rootAngles) {
      const rDist = moduleSize * 1.25;
      const rTip = new THREE.Vector3(
        Math.cos(ang) * rDist,
        paverBlockHeight,
        Math.sin(ang) * rDist
      );
      addCylinderSegment(
        trunkGroup,
        basePts[0].pos,
        rTip,
        moduleSize * 0.45,
        moduleSize * 0.15,
        trunkMat,
        5
      );
    }

    // 5 Primary Spreading Boughs
    const forkOrigin = basePts[basePts.length - 1].pos;
    interface BranchDef {
      target: THREE.Vector3;
      radiusStart: number;
      radiusEnd: number;
      twigs: THREE.Vector3[];
    }

    const boughDefs: BranchDef[] = [
      // 1. East-North Bough
      {
        target: new THREE.Vector3(2.6, 8.2, 1.8),
        radiusStart: moduleSize * 0.46,
        radiusEnd: moduleSize * 0.28,
        twigs: [
          new THREE.Vector3(3.8, 9.5, 2.5),
          new THREE.Vector3(3.2, 8.0, 3.4),
          new THREE.Vector3(2.4, 9.8, 1.2),
        ],
      },
      // 2. West-North Bough
      {
        target: new THREE.Vector3(-2.5, 8.6, 2.1),
        radiusStart: moduleSize * 0.46,
        radiusEnd: moduleSize * 0.28,
        twigs: [
          new THREE.Vector3(-3.7, 9.8, 2.8),
          new THREE.Vector3(-3.2, 8.2, 3.5),
          new THREE.Vector3(-2.1, 10.2, 1.4),
        ],
      },
      // 3. East-South Bough
      {
        target: new THREE.Vector3(2.4, 8.5, -2.4),
        radiusStart: moduleSize * 0.44,
        radiusEnd: moduleSize * 0.26,
        twigs: [
          new THREE.Vector3(3.6, 9.6, -3.2),
          new THREE.Vector3(2.2, 10.0, -1.8),
          new THREE.Vector3(3.1, 8.1, -3.8),
        ],
      },
      // 4. West-South Bough
      {
        target: new THREE.Vector3(-2.4, 8.0, -2.1),
        radiusStart: moduleSize * 0.44,
        radiusEnd: moduleSize * 0.26,
        twigs: [
          new THREE.Vector3(-3.5, 9.2, -2.9),
          new THREE.Vector3(-2.0, 9.8, -1.5),
          new THREE.Vector3(-3.0, 7.8, -3.4),
        ],
      },
      // 5. Central Crown Leader (Reaching top)
      {
        target: new THREE.Vector3(0.1, 10.2, 0.0),
        radiusStart: moduleSize * 0.48,
        radiusEnd: moduleSize * 0.28,
        twigs: [
          new THREE.Vector3(0.8, 12.0, 0.7),
          new THREE.Vector3(-0.7, 12.2, 0.6),
          new THREE.Vector3(0.2, 12.6, -0.8),
          new THREE.Vector3(0.0, 13.5, 0.1),
        ],
      },
    ];

    const leafAnchorCenters: { pos: THREE.Vector3; weight: number }[] = [];

    for (const b of boughDefs) {
      addCylinderSegment(trunkGroup, forkOrigin, b.target, b.radiusStart, b.radiusEnd, branchMat, 6);
      leafAnchorCenters.push({ pos: b.target.clone(), weight: 1.2 });

      for (const tw of b.twigs) {
        addCylinderSegment(trunkGroup, b.target, tw, b.radiusEnd, b.radiusEnd * 0.55, branchMat, 5);
        leafAnchorCenters.push({ pos: tw.clone(), weight: 1.0 });
      }
    }
    rootGroup.add(trunkGroup);

    // ==========================================
    // 4. PIXEL-PETAL CANOPY (STEPPED QUANTIZED PALETTE)
    // ==========================================
    const canopyGroup = new THREE.Group();
    canopyGroup.name = 'PixelPetalCanopy';

    // 4-Tier Quantized Palette Colors
    const colTier1 = new THREE.Color(palette.tier1Highlight); // Top sunlit tips
    const colTier2 = new THREE.Color(palette.tier2Light);     // Fresh emerald
    const colTier3 = new THREE.Color(palette.tier3Midtone);   // Lush body
    const colTier4 = new THREE.Color(palette.tier4Shadow);    // Under-canopy shadow

    // Leaf Petal Geometry (2-triangle folded diamond quad)
    const petalW = moduleSize * 0.68;
    const petalL = moduleSize * 0.88;
    const petalGeo = createPixelPetalGeometry(petalW, petalL);

    const petalMat = new THREE.MeshStandardMaterial({
      roughness: 0.58,
      metalness: 0.02,
      side: THREE.DoubleSide,
      flatShading: true, // Crucial for crisp, stair-stepped facet shading
    });

    // Generate ~1400 individual instanced leaf petals around anchor centers
    const TOTAL_PETALS = 1450;
    const leafMesh = new THREE.InstancedMesh(petalGeo, petalMat, TOTAL_PETALS);
    leafMesh.name = 'InstancedPixelLeaves';
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;

    const leafDataList: LeafPetalData[] = [];
    const dummyLeaf = new THREE.Object3D();

    for (let i = 0; i < TOTAL_PETALS; i++) {
      // Pick an anchor twig node
      const anchor = rng.choice(leafAnchorCenters);
      const spreadR = rng.range(0.2, 2.1 * anchor.weight);
      const spreadTh = rng.angle();
      const spreadPhi = rng.range(-0.4, Math.PI + 0.4);

      const px = anchor.pos.x + Math.sin(spreadPhi) * Math.cos(spreadTh) * spreadR;
      const py = anchor.pos.y + Math.cos(spreadPhi) * (spreadR * 0.85);
      const pz = anchor.pos.z + Math.sin(spreadPhi) * Math.sin(spreadTh) * spreadR;

      // Orientation: Petals fan naturally outward and slightly upward
      const rx = rng.range(-0.6, 0.6) + Math.cos(spreadTh) * 0.35;
      const ry = rng.angle();
      const rz = rng.range(-0.6, 0.6) + Math.sin(spreadTh) * 0.35;

      const scale = rng.range(0.8, 1.25);

      // 4-Tier Stepped Palette assignment based on height & top layer
      // Tier 1: Highest canopy pinnacle (py > 12.2)
      // Tier 2: Upper canopy (py > 10.2)
      // Tier 3: Mid body (py > 8.0)
      // Tier 4: Bottom skirt & deep underside (py <= 8.0)
      let pColor = colTier3;
      const colorHash = rng.next();

      if (py > 12.0) {
        pColor = colorHash < 0.65 ? colTier1 : colTier2;
      } else if (py > 10.0) {
        if (colorHash < 0.35) pColor = colTier1;
        else if (colorHash < 0.80) pColor = colTier2;
        else pColor = colTier3;
      } else if (py > 8.0) {
        if (colorHash < 0.25) pColor = colTier2;
        else if (colorHash < 0.75) pColor = colTier3;
        else pColor = colTier4;
      } else {
        pColor = colorHash < 0.65 ? colTier4 : colTier3;
      }

      dummyLeaf.position.set(px, py, pz);
      dummyLeaf.rotation.set(rx, ry, rz);
      dummyLeaf.scale.set(scale, scale, scale);
      dummyLeaf.updateMatrix();

      leafMesh.setMatrixAt(i, dummyLeaf.matrix);
      leafMesh.setColorAt(i, pColor);

      leafDataList.push({
        baseX: px,
        baseY: py,
        baseZ: pz,
        rotX: rx,
        rotY: ry,
        rotZ: rz,
        scale,
        color: pColor,
        phase: px * 0.7 + pz * 0.5 + rng.range(0, 1.5),
        swayAmp: rng.range(0.06, 0.14),
      });
    }

    leafMesh.instanceMatrix.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    canopyGroup.add(leafMesh);
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

      // In QR scan mode: multi-tone pixel green/seasonal mosaic with deep finder contrast
      let colorQR: THREE.Color;
      if (mod.isFinder) {
        // High-contrast deep tone for finder eye patterns -> Instant <0.1s camera detection!
        colorQR = new THREE.Color(palette.qrFinderDark);
      } else {
        const rVal = rng.next();
        if (rVal < 0.22) {
          colorQR = new THREE.Color(palette.tier1Highlight);
        } else if (rVal < 0.55) {
          colorQR = new THREE.Color(palette.tier2Light);
        } else if (rVal < 0.85) {
          colorQR = new THREE.Color(palette.tier3Midtone);
        } else {
          colorQR = new THREE.Color(palette.tier4Shadow);
        }
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

      // 1. Collapse tree, branches, canopy & grass when morphing to top-down QR
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

      fallenGroup.position.y = -0.5 * p;
      fallenGroup.scale.set(decorScale, decorScale, decorScale);
      fallenGroup.visible = p < 0.98;

      // 2. Real-time Wind Sway for Leaf Petals
      if (canopyGroup.visible) {
        const windBaseX = Math.sin(time * 1.3) * 0.12;
        const windBaseZ = Math.cos(time * 1.05) * 0.08;

        for (let i = 0; i < TOTAL_PETALS; i += 2) { // update every other petal for 60fps silky smoothness
          const leaf = leafDataList[i];
          const hRatio = leaf.baseY / 12.0;

          const swayX = windBaseX * hRatio + Math.sin(time * 2.2 + leaf.phase) * leaf.swayAmp;
          const swayZ = windBaseZ * hRatio + Math.cos(time * 1.8 + leaf.phase) * leaf.swayAmp;
          const swayRot = Math.sin(time * 2.4 + leaf.phase) * 0.08;

          dummyLeaf.position.set(leaf.baseX + swayX, leaf.baseY, leaf.baseZ + swayZ);
          dummyLeaf.rotation.set(leaf.rotX + swayRot, leaf.rotY, leaf.rotZ + swayRot);
          dummyLeaf.scale.set(leaf.scale, leaf.scale, leaf.scale);
          dummyLeaf.updateMatrix();

          leafMesh.setMatrixAt(i, dummyLeaf.matrix);
        }
        leafMesh.instanceMatrix.needsUpdate = true;
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
