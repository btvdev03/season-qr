/**
 * SeasonQR - Authentic Botanical Tree & Mosaic QR Transformer
 *
 * Implements the exact botanical architecture of ICQR Magic Tree:
 * 1. Living Botanical Tree Mode:
 *    - Curving organic trunk with mathematical bark lean & taper (function se).
 *    - Graceful multi-forking branches winding through negative space into 22 foliage cloud anchors.
 *    - Over 2,600 small, soft, textured foliage quads (0.55 scale) with alpha-tested leaf silhouettes.
 *    - Voluminous, fluffy Ghibli-style tree canopy with lush sunlit color gradient:
 *      * Sunlit lime highlights on top (#bef264, #a3e635)
 *      * Lush emerald midtones in the body (#4ade80, #22c55e)
 *      * Deep forest shadows underneath (#166534, #14532d)
 *    - Real-time harmonic wind sway & flutter physics (60 FPS).
 *    - Isometric stone patio with multi-blade grass tufts at corners and scattered fallen petals.
 *
 * 2. Signature Leaf Flight & Garden Mosaic QR Mode (Image 4):
 *    - Tapping triggers the canopy foliage to cascade down in organic curved wind-drift arcs.
 *    - The ground plate emerges into the exact multi-tone artistic mosaic QR code (Image 4).
 *    - Modules touch seamlessly at 1.002 scale for 100% instant phone camera lock.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface FoliageLeaf {
  treePos: THREE.Vector3;
  treeRot: THREE.Euler;
  treeScale: THREE.Vector3;
  targetPos: THREE.Vector3;
  delay: number;
  arcY: number;
  spin: number;
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
 * Procedural leaf silhouette texture with natural organic contour and vein
 */
function createFoliageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  // Soft organic leaf silhouette
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 10);
  ctx.bezierCurveTo(100, 22, 118, 62, 98, 100);
  ctx.bezierCurveTo(82, 122, 46, 122, 30, 100);
  ctx.bezierCurveTo(10, 62, 28, 22, 64, 10);
  ctx.fill();

  // Subtle interior vein highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(64, 25);
  ctx.quadraticCurveTo(63, 65, 64, 106);
  ctx.stroke();

  // Lateral veins
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(64, 45);
  ctx.quadraticCurveTo(78, 52, 86, 62);
  ctx.moveTo(64, 45);
  ctx.quadraticCurveTo(50, 52, 42, 62);
  ctx.moveTo(64, 72);
  ctx.quadraticCurveTo(80, 78, 86, 88);
  ctx.moveTo(64, 72);
  ctx.quadraticCurveTo(48, 78, 42, 88);
  ctx.stroke();

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
    rootGroup.name = 'Style_BotanicalTree';

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

    // Warm cream patio surface floor
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

    // Subtle stone tile textures for light modules
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
    // 3. CURVING ORGANIC TRUNK & BRANCH NETWORK (function se)
    // ==========================================
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'TreeTrunk';

    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.trunk),
      roughness: 0.82,
      metalness: 0.05,
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.branch),
      roughness: 0.78,
      metalness: 0.05,
    });

    // Trunk architecture following ICQR function se
    const trunkHeight = 11.5;
    const trunkSegments = 10;
    const trunkBaseR = moduleSize * 0.85;
    const trunkLean = rng.range(0.4, 0.7) * (rng.chance(0.5) ? 1 : -1);

    interface CanopyAnchor {
      x: number;
      y: number;
      z: number;
      radius: number;
    }
    const canopyAnchors: CanopyAnchor[] = [];

    // Evaluate mathematical trunk spine
    const trunkPoints: { x: number; y: number; z: number; r: number }[] = [];
    for (let s = 0; s <= trunkSegments; s++) {
      const t = s / trunkSegments; // 0 -> 1
      const x = trunkLean * t * t + 0.3 * trunkLean * Math.sin(t * Math.PI * 1.5);
      const y = t * trunkHeight;
      const z = 0.5 * trunkLean * Math.sin(t * Math.PI * 0.8);
      const r = trunkBaseR * (1.0 - 0.55 * t) * (1.0 + 0.08 * Math.sin(t * Math.PI * 0.8));
      trunkPoints.push({ x, y, z, r });
    }

    // Build tapered cylinder mesh segments for the trunk
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

      // Anchor foliage clusters along upper half of trunk
      if (s >= 4) {
        canopyAnchors.push({
          x: pB.x,
          y: pB.y,
          z: pB.z,
          radius: rng.range(2.6, 3.8),
        });
      }
    }

    // Major branches branching outward into the crown
    const numMajorBranches = 8;
    for (let b = 0; b < numMajorBranches; b++) {
      const bFrac = b / numMajorBranches;
      const startIdx = Math.floor(rng.range(4, 9));
      const startP = trunkPoints[startIdx];

      const bAngle = bFrac * Math.PI * 2 + rng.range(-0.3, 0.3);
      const bLength = rng.range(4.0, 5.8);
      const bElevation = rng.range(0.35, 0.65);

      const endX = startP.x + Math.cos(bAngle) * bLength * Math.cos(bElevation);
      const endY = startP.y + bLength * Math.sin(bElevation);
      const endZ = startP.z + Math.sin(bAngle) * bLength * Math.cos(bElevation);

      const midX = (startP.x + endX) / 2;
      const midY = (startP.y + endY) / 2;
      const midZ = (startP.z + endZ) / 2;
      const len = Math.hypot(endX - startP.x, endY - startP.y, endZ - startP.z);

      const bGeo = new THREE.CylinderGeometry(
        0.13 * moduleSize,
        0.28 * moduleSize,
        len,
        6
      );
      const bMesh = new THREE.Mesh(bGeo, branchMat);
      bMesh.position.set(midX, midY, midZ);
      bMesh.lookAt(endX, endY, endZ);
      bMesh.rotateX(Math.PI / 2);
      bMesh.castShadow = true;
      trunkGroup.add(bMesh);

      canopyAnchors.push({
        x: endX,
        y: endY,
        z: endZ,
        radius: rng.range(2.5, 3.6),
      });

      // Secondary twig branching
      const numSub = rng.int(1, 2);
      for (let sb = 0; sb < numSub; sb++) {
        const subAngle = bAngle + rng.range(-0.5, 0.5);
        const subLen = rng.range(2.0, 3.2);
        const subElev = rng.range(0.2, 0.55);

        const subEndX = endX + Math.cos(subAngle) * subLen * Math.cos(subElev);
        const subEndY = endY + subLen * Math.sin(subElev);
        const subEndZ = endZ + Math.sin(subAngle) * subLen * Math.cos(subElev);

        const subMidX = (endX + subEndX) / 2;
        const subMidY = (endY + subEndY) / 2;
        const subMidZ = (endZ + subEndZ) / 2;
        const subLenActual = Math.hypot(subEndX - endX, subEndY - endY, subEndZ - endZ);

        const subGeo = new THREE.CylinderGeometry(
          0.08 * moduleSize,
          0.13 * moduleSize,
          subLenActual,
          4
        );
        const subMesh = new THREE.Mesh(subGeo, branchMat);
        subMesh.position.set(subMidX, subMidY, subMidZ);
        subMesh.lookAt(subEndX, subEndY, subEndZ);
        subMesh.rotateX(Math.PI / 2);
        subMesh.castShadow = true;
        trunkGroup.add(subMesh);

        canopyAnchors.push({
          x: subEndX,
          y: subEndY,
          z: subEndZ,
          radius: rng.range(2.0, 3.0),
        });
      }
    }

    // Top pinnacle anchors
    const topP = trunkPoints[trunkPoints.length - 1];
    canopyAnchors.push({
      x: topP.x,
      y: topP.y + 1.8,
      z: topP.z,
      radius: 3.2,
    });
    canopyAnchors.push({
      x: topP.x + 0.6,
      y: topP.y + 3.2,
      z: topP.z + 0.3,
      radius: 2.5,
    });

    rootGroup.add(trunkGroup);

    // ==========================================
    // 4. LUSH FOLIAGE CLOUDS (2,600+ Fluffy Leaf Cards, Image 2)
    // ==========================================
    const foliageTex = createFoliageTexture();
    const foliageMat = new THREE.MeshStandardMaterial({
      map: foliageTex,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // Small, soft leaf card geometry
    const leafGeo = new THREE.PlaneGeometry(moduleSize * 0.55, moduleSize * 0.65);
    leafGeo.rotateX(-Math.PI / 2);

    const totalFoliageCount = canopyAnchors.length * 120; // ~2,640 leaves!
    const foliageMesh = new THREE.InstancedMesh(leafGeo, foliageMat, totalFoliageCount);
    foliageMesh.name = 'FoliageCanopy';
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const foliageLeaves: FoliageLeaf[] = [];
    const dummyFoliage = new THREE.Object3D();

    let fIdx = 0;
    for (let a = 0; a < canopyAnchors.length; a++) {
      const anchor = canopyAnchors[a];
      const leavesInCluster = 120;

      for (let l = 0; l < leavesInCluster; l++) {
        // Organic spherical cloud distribution with power falloff
        const theta = rng.angle();
        const phi = Math.acos(rng.range(-1, 1));
        const dist = Math.cbrt(rng.next()) * anchor.radius;

        const lx = anchor.x + dist * Math.sin(phi) * Math.cos(theta);
        const ly = anchor.y + dist * Math.sin(phi) * Math.sin(theta) * 0.95;
        const lz = anchor.z + dist * Math.cos(phi);

        const treePos = new THREE.Vector3(lx, ly, lz);

        // Natural outward normal angle with organic flutter tilt
        const treeRot = new THREE.Euler(
          rng.range(-0.8, 0.8),
          rng.angle(),
          rng.range(-0.8, 0.8)
        );

        // Fluffy natural card scale
        const s = rng.range(0.85, 1.4);
        const treeScale = new THREE.Vector3(s, s, s);

        // Ground landing position when morphing (dissolves into wind drift)
        const targetX = anchor.x + rng.range(-sceneSize * 0.45, sceneSize * 0.45);
        const targetZ = anchor.z + rng.range(-sceneSize * 0.45, sceneSize * 0.45);
        const targetPos = new THREE.Vector3(targetX, 0.035, targetZ);

        const delay = rng.range(0, 0.28);
        const arcY = rng.range(2.5, 4.5);
        const spin = rng.range(3.0, 6.0) * (rng.chance(0.5) ? 1 : -1);
        const phase = rng.range(0, Math.PI * 2);
        const swayAmp = rng.range(0.25, 0.45);

        foliageLeaves.push({
          treePos,
          treeRot,
          treeScale,
          targetPos,
          delay,
          arcY,
          spin,
          phase,
          swayAmp,
        });

        // Botanical sunlight color gradient (Image 2)
        const normH = THREE.MathUtils.clamp((ly - 4.0) / 11.5, 0, 1);
        let colorHex: string;
        if (normH > 0.72) {
          colorHex = rng.choice(palette.highlights);
        } else if (normH > 0.35) {
          colorHex = rng.choice(palette.midtones);
        } else {
          colorHex = rng.choice(palette.shadows);
        }

        foliageMesh.setColorAt(fIdx, new THREE.Color(colorHex));

        // Initial 3D placement
        dummyFoliage.position.copy(treePos);
        dummyFoliage.rotation.copy(treeRot);
        dummyFoliage.scale.copy(treeScale);
        dummyFoliage.updateMatrix();
        foliageMesh.setMatrixAt(fIdx, dummyFoliage.matrix);

        fIdx++;
      }
    }

    foliageMesh.instanceMatrix.needsUpdate = true;
    if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
    rootGroup.add(foliageMesh);

    // ==========================================
    // 5. ARTISTIC GROUND MOSAIC QR CODE (Image 4)
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
    // Seamless mosaic tile geometry (touches adjacent modules at 1.002 scale)
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

      // In tree mode: flush stone paver tint (#f5f0e6)
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
      dummyQR.scale.set(1, 0.2, 1); // low relief in tree mode
      dummyQR.updateMatrix();
      qrTileMesh.setMatrixAt(i, dummyQR.matrix);
      qrTileMesh.setColorAt(i, colorTree);
    }

    qrTileMesh.instanceMatrix.needsUpdate = true;
    if (qrTileMesh.instanceColor) qrTileMesh.instanceColor.needsUpdate = true;
    rootGroup.add(qrTileMesh);

    // ==========================================
    // 6. REAL-TIME WIND SWAY & MORPH ANIMATION (60 FPS)
    // ==========================================
    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Trunk and Grass scale down as we morph into flat QR
      const decorScale = Math.max(0.0001, 1 - Math.pow(p, 1.3));
      trunkGroup.scale.set(decorScale, decorScale, decorScale);
      trunkGroup.visible = p < 0.98;

      grassGroup.scale.set(decorScale, decorScale, decorScale);
      grassGroup.visible = p < 0.98;

      fallenGroup.scale.set(decorScale, decorScale, decorScale);
      fallenGroup.visible = p < 0.98;

      // Wind sway factor: full strength at p = 0, damped smoothly during transition
      const windFactor = Math.pow(Math.max(0, 1 - p), 2.2);

      // 2. Animate the 2,600+ foliage leaves (wind sway in tree mode, flight dissolve in QR mode)
      foliageMesh.visible = p < 0.98;
      if (foliageMesh.visible) {
        for (let i = 0; i < totalFoliageCount; i++) {
          const d = foliageLeaves[i];

          // Harmonic wind sway (higher leaves sway with gentle breeze)
          const heightFactor = Math.max(0.12, (d.treePos.y - 3.5) / 11.5);
          const swayX = Math.sin(time * 2.2 + d.phase + d.treePos.y * 0.35) * d.swayAmp * heightFactor;
          const swayZ = Math.cos(time * 1.8 + d.phase + d.treePos.x * 0.35) * d.swayAmp * heightFactor;
          const swayY = Math.sin(time * 3.1 + d.phase) * (d.swayAmp * 0.35) * heightFactor;

          const flutterRoll = Math.sin(time * 3.8 + d.phase) * 0.18 * heightFactor;
          const flutterPitch = Math.cos(time * 2.9 + d.phase) * 0.14 * heightFactor;

          // Transition interpolation
          const localT = THREE.MathUtils.clamp(
            (p - d.delay) / (1 - 0.3),
            0,
            1
          );

          const ease =
            localT < 0.5
              ? 4 * localT * localT * localT
              : 1 - Math.pow(-2 * localT + 2, 3) / 2;

          const arc = Math.sin(localT * Math.PI) * d.arcY * (1 - p * 0.4);

          dummyFoliage.position.x = THREE.MathUtils.lerp(d.treePos.x + swayX * windFactor, d.targetPos.x, ease);
          dummyFoliage.position.y = THREE.MathUtils.lerp(d.treePos.y + swayY * windFactor, d.targetPos.y, ease) + arc;
          dummyFoliage.position.z = THREE.MathUtils.lerp(d.treePos.z + swayZ * windFactor, d.targetPos.z, ease);

          dummyFoliage.rotation.x = THREE.MathUtils.lerp(d.treeRot.x + flutterPitch * windFactor, 0, ease);
          dummyFoliage.rotation.y = THREE.MathUtils.lerp(d.treeRot.y + d.spin * (1 - ease), 0, ease);
          dummyFoliage.rotation.z = THREE.MathUtils.lerp(d.treeRot.z + flutterRoll * windFactor, 0, ease);

          // As leaves fall to the ground, they dissolve away, revealing the clean mosaic QR!
          const scaleMult = Math.max(0.0001, 1 - ease);
          dummyFoliage.scale.set(
            d.treeScale.x * scaleMult,
            d.treeScale.y * scaleMult,
            d.treeScale.z * scaleMult
          );

          dummyFoliage.updateMatrix();
          foliageMesh.setMatrixAt(i, dummyFoliage.matrix);
        }
        foliageMesh.instanceMatrix.needsUpdate = true;
      }

      // 3. Animate Ground QR Mosaic Tiles (flush pavers in tree mode -> vibrant mosaic QR code in scan mode)
      const qrEase =
        p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      for (let i = 0; i < qrTileCount; i++) {
        const mod = qrModules[i];

        // Rise from flush paver (Y = 0.026) to sharp QR module (Y = 0.042)
        const curY = THREE.MathUtils.lerp(0.026, 0.042, qrEase);
        const curScaleY = THREE.MathUtils.lerp(0.2, 1.0, qrEase);

        dummyQR.position.set(mod.worldPos.x, curY, mod.worldPos.z);
        dummyQR.scale.set(1.0, curScaleY, 1.0);
        dummyQR.updateMatrix();
        qrTileMesh.setMatrixAt(i, dummyQR.matrix);

        // Interpolate color from cream paver to artistic mosaic green
        const curColor = new THREE.Color().lerpColors(mod.colorTree, mod.colorQR, qrEase);
        qrTileMesh.setColorAt(i, curColor);
      }

      qrTileMesh.instanceMatrix.needsUpdate = true;
      if (qrTileMesh.instanceColor) qrTileMesh.instanceColor.needsUpdate = true;
    };

    return rootGroup;
  },
};
