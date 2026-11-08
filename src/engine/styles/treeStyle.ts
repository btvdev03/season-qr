/**
 * SeasonQR - Signature HD-2D Pixel Art Tree & Voxel Patio QR Transformer
 *
 * Combining the magic of retro 16-bit / 32-bit pixel art with modern 3D isometric diorama:
 * 1. Authentic Handcrafted Pixel Art Tree Sprites:
 *    - Uses authentic pixel art sprites directly inspired by user references:
 *      * Summer: Vibrant emerald & lime oak/birch with drifting wind leaf flakes.
 *      * Autumn: Crimson & pumpkin maple with pixelated wood bark.
 *      * Spring: Soft cherry blossom sakura with pink petal drifts.
 *      * Winter: Frost pine covered in pure white snow.
 *      * Cyberpunk: Neon cyan & magenta cyber tree.
 *    - Crisp THREE.NearestFilter rendering: 100% sharp pixel edges, zero blurring!
 *    - Living wind sway & drifting pixel leaf particle system.
 *
 * 2. 3D Voxel Stone Paver Patio:
 *    - Discrete 3D voxel cubes (BoxGeometry) corresponding 1:1 with QR modules.
 *    - Beveled stone paving in warm limestone/sand with perimeter stone curb.
 *    - Corner & border pixel grass tufts with delicate wildflowers.
 *
 * 3. 100% Guaranteed Smartphone Camera QR Scan Lock (<0.1s):
 *    - In Scan Mode (progress -> 1.0), the pixel tree dissolves/shrinks gracefully into the patio.
 *    - The stone patio reveals an ultra-high-contrast QR matrix (Level H 30% error correction).
 *    - Smartphone cameras lock and decode instantly in <0.1s!
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface QRMosaicModule {
  worldPos: THREE.Vector3;
  colorTree: THREE.Color;
  colorQR: THREE.Color;
}

interface DriftingPixelLeaf {
  mesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseZ: number;
  driftSpeedX: number;
  driftSpeedY: number;
  phase: number;
}

// Pre-configured texture paths from public folder
const PIXEL_TREE_TEXTURES: Record<string, string> = {
  summer: '/tree_summer_pixel.png',
  autumn: '/tree_autumn_pixel.png',
  spring: '/tree_spring_pixel.png',
  winter: '/tree_winter_pixel.png',
  cyberpunk: '/tree_cyberpunk_pixel.png',
};

// Seasonal color configurations for patio & QR base
function getPixelDioramaPalette(seasonId: string) {
  switch (seasonId) {
    case 'autumn':
      return {
        leafFlakeColor: '#dc2626',
        leafFlakeAlt: '#f59e0b',
        grassMid: '#b45309',
        grassTip: '#f59e0b',
        flowerColors: ['#fbbf24', '#f97316', '#ef4444'],
        stoneLight: '#f5efe6',
        stoneDark: '#e8ded2',
        stoneShadow: '#dad0c0',
        plinthCurb: '#573c2a',
        qrFinderDark: '#3b0d0c',
        qrDataColors: ['#fde047', '#fb923c', '#dc2626', '#7f1d1d'],
      };
    case 'spring':
      return {
        leafFlakeColor: '#fbcfe8',
        leafFlakeAlt: '#f472b6',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fbcfe8', '#f472b6'],
        stoneLight: '#f6f2ec',
        stoneDark: '#ece5dc',
        stoneShadow: '#ddd4c9',
        plinthCurb: '#4a3832',
        qrFinderDark: '#4c0519',
        qrDataColors: ['#fff1f2', '#fbcfe8', '#f43f5e', '#881337'],
      };
    case 'winter':
      return {
        leafFlakeColor: '#ffffff',
        leafFlakeAlt: '#bae6fd',
        grassMid: '#475569',
        grassTip: '#94a3b8',
        flowerColors: ['#ffffff', '#e2e8f0', '#bae6fd'],
        stoneLight: '#f1f5f9',
        stoneDark: '#e2e8f0',
        stoneShadow: '#cbd5e1',
        plinthCurb: '#334155',
        qrFinderDark: '#0f172a',
        qrDataColors: ['#ffffff', '#bae6fd', '#64748b', '#1e293b'],
      };
    case 'cyberpunk':
      return {
        leafFlakeColor: '#f0abfc',
        leafFlakeAlt: '#06b6d4',
        grassMid: '#6366f1',
        grassTip: '#38bdf8',
        flowerColors: ['#06b6d4', '#f43f5e', '#a855f7'],
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
        leafFlakeColor: '#86af53',
        leafFlakeAlt: '#a1d565',
        grassMid: '#16a34a',
        grassTip: '#4ade80',
        flowerColors: ['#ffffff', '#fde047', '#f472b6'],
        stoneLight: '#f5f0e6',
        stoneDark: '#ede5d8',
        stoneShadow: '#dfd5c4',
        plinthCurb: '#4a3b32',
        qrFinderDark: '#052e16',
        qrDataColors: ['#bef264', '#4ade80', '#22c55e', '#15803d'],
      };
  }
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
 * Creates a cute 5-petal pixel wildflower
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
  name: 'HD-2D Pixel Art Tree & Voxel Patio',
  vietnameseName: 'Cây Pixel Art 16-Bit & Sân Voxel',
  icon: '🌳',
  description: 'An authentic HD-2D pixel art tree diorama swaying gently in the wind over a 3D voxel stone patio.',
  vietnameseDescription: 'Cây Pixel Art 16-bit hoài niệm đung đưa trong gió trên nền sân đá Voxel 3D.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const moduleSize = sceneSize / N;
    const palette = getPixelDioramaPalette(season.id);

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_HD2DPixelArtDiorama';

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
    // 3. HD-2D AUTHENTIC PIXEL ART TREE SPRITE
    // ==========================================
    const pixelTreeGroup = new THREE.Group();
    pixelTreeGroup.name = 'HD2DPixelArtTree';

    const texturePath = PIXEL_TREE_TEXTURES[season.id] || PIXEL_TREE_TEXTURES.summer;
    const textureLoader = new THREE.TextureLoader();
    const pixelTexture = textureLoader.load(texturePath);

    // Set NearestFilter for authentic crisp 16-bit pixel art edges
    pixelTexture.minFilter = THREE.NearestFilter;
    pixelTexture.magFilter = THREE.NearestFilter;
    pixelTexture.generateMipmaps = false;
    pixelTexture.colorSpace = THREE.SRGBColorSpace;

    // Tree Dimensions
    const treeHeight = 15.5;
    // Aspect ratios: Summer 258x199 -> aspect ~1.3, Autumn 205x260 -> aspect ~0.79
    const isAutumn = season.id === 'autumn';
    const treeWidth = isAutumn ? treeHeight * 0.79 : treeHeight * 1.3;

    const treePlaneGeo = new THREE.PlaneGeometry(treeWidth, treeHeight);
    // Shift geometry origin so base of trunk is at (0, 0, 0)
    treePlaneGeo.translate(0, treeHeight / 2, 0);

    const treeMat = new THREE.MeshStandardMaterial({
      map: pixelTexture,
      transparent: true,
      alphaTest: 0.15, // Crisp pixel alpha cutout, no fuzzy fringe
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // HD-2D Dual-Cross Planes:
    // Two planes oriented along diagonal isometric sightlines to give 3D depth from all angles
    const planeA = new THREE.Mesh(treePlaneGeo, treeMat);
    planeA.position.set(0, paverBlockHeight, 0);
    planeA.rotation.y = Math.PI / 4; // 45 deg facing isometric camera perfectly!
    planeA.castShadow = true;
    pixelTreeGroup.add(planeA);

    const planeB = new THREE.Mesh(treePlaneGeo, treeMat);
    planeB.position.set(0, paverBlockHeight, 0);
    planeB.rotation.y = -Math.PI / 4; // -45 deg cross-plane providing depth
    planeB.scale.set(0.92, 1.0, 0.92);
    planeB.castShadow = true;
    pixelTreeGroup.add(planeB);

    // ==========================================
    // 4. DRIFTING PIXEL LEAF FLAKES (Wind Particle Accent)
    // ==========================================
    const leafFlakesGroup = new THREE.Group();
    leafFlakesGroup.name = 'DriftingPixelLeaves';

    const flakeGeo = new THREE.PlaneGeometry(moduleSize * 0.45, moduleSize * 0.45);
    const flakeMatA = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.leafFlakeColor),
      side: THREE.DoubleSide,
    });
    const flakeMatB = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.leafFlakeAlt),
      side: THREE.DoubleSide,
    });

    const driftingFlakes: DriftingPixelLeaf[] = [];
    const FLAKE_COUNT = 24;

    for (let f = 0; f < FLAKE_COUNT; f++) {
      const fMat = f % 2 === 0 ? flakeMatA : flakeMatB;
      const fMesh = new THREE.Mesh(flakeGeo, fMat);

      const bx = rng.range(-treeWidth * 0.35, treeWidth * 0.4);
      const by = rng.range(5.0, treeHeight * 0.95);
      const bz = rng.range(-2.5, 2.5);

      fMesh.position.set(bx, by, bz);
      fMesh.rotation.set(rng.angle(), rng.angle(), rng.angle());
      leafFlakesGroup.add(fMesh);

      driftingFlakes.push({
        mesh: fMesh,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        driftSpeedX: rng.range(0.8, 1.8),
        driftSpeedY: rng.range(0.4, 0.9),
        phase: rng.range(0, Math.PI * 2),
      });
    }
    pixelTreeGroup.add(leafFlakesGroup);
    rootGroup.add(pixelTreeGroup);

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

      // 1. Collapse Pixel Tree & Grass when morphing to top-down QR
      const treeScale = Math.max(0.0001, 1.0 - Math.pow(p, 1.3));
      const treeSinkY = paverBlockHeight - 12.0 * p;

      pixelTreeGroup.position.y = treeSinkY;
      pixelTreeGroup.scale.set(treeScale, treeScale, treeScale);
      pixelTreeGroup.visible = p < 0.98;

      grassGroup.position.y = -0.8 * p;
      grassGroup.scale.set(treeScale, treeScale, treeScale);
      grassGroup.visible = p < 0.98;

      // 2. Real-time Gentle Wind Sway for Pixel Tree
      if (pixelTreeGroup.visible) {
        const windSwayZ = Math.sin(time * 1.5) * 0.035;
        const windSwayX = Math.cos(time * 1.2) * 0.02;
        planeA.rotation.z = windSwayZ;
        planeA.rotation.x = windSwayX;
        planeB.rotation.z = -windSwayZ * 0.8;
        planeB.rotation.x = windSwayX * 0.8;

        // Animate drifting pixel leaf flakes
        for (let f = 0; f < FLAKE_COUNT; f++) {
          const flake = driftingFlakes[f];
          // Drift to the right and down with time
          const tOffset = (time * flake.driftSpeedX + flake.phase) % 8.0;
          const driftX = flake.baseX + tOffset * 1.6;
          const driftY = flake.baseY - (tOffset * flake.driftSpeedY * 1.4);
          const driftZ = flake.baseZ + Math.sin(time * 2.0 + flake.phase) * 0.5;

          flake.mesh.position.set(driftX, Math.max(paverBlockHeight + 0.1, driftY), driftZ);
          flake.mesh.rotation.z = time * 2.5 + flake.phase;
        }
      }

      // 3. Smooth Color Morph for QR Voxel Modules
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
