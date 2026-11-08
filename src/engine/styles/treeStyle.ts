/**
 * SeasonQR - Authentic Procedural Tree & Leaf-to-QR Transformer
 *
 * Faithfully recreates the lush artistic visual aesthetic of ICQR Magic Tree:
 * - Lush, voluminous, tall organic canopy with natural sun-drenched color gradients.
 * - Multi-forking organic branches winding through negative spaces in the foliage.
 * - Pavement stone plot with scattered fallen leaves/petals.
 * - Lush multi-blade grass tufts clustered along edges and corners.
 * - Seamless morph: Each leaf flutters down into the exact artistic mosaic QR code (Image 2)!
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number) => void;
}

interface LeafTransform {
  // 3D Tree Canopy state
  treePos: THREE.Vector3;
  treeRot: THREE.Euler;
  treeScale: THREE.Vector3;

  // 2D QR Code state
  qrPos: THREE.Vector3;
  qrRot: THREE.Euler;
  qrScale: THREE.Vector3;

  // Dynamic animation attributes
  delay: number;
  arcY: number;
  spin: number;
}

/**
 * Seasonal color schemes for the lush tree canopy and mosaic QR code
 */
function getSeasonalCanopyPalette(seasonId: string) {
  switch (seasonId) {
    case 'autumn':
      return {
        highlights: ['#facc15', '#fde047', '#fb923c', '#f97316'],
        midtones: ['#ea580c', '#dc2626', '#c2410c', '#b91c1c'],
        shadows: ['#991b1b', '#7f1d1d', '#78350f', '#451a03'],
        trunk: '#5c3826',
        branch: '#795548',
        grass: '#b45309',
        fallenLeaves: ['#dc2626', '#f59e0b', '#d97706', '#b91c1c'],
        stoneLight: '#f5f0e6',
        stoneDark: '#e8dfd1',
      };
    case 'spring':
      return {
        highlights: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6'],
        midtones: ['#ec4899', '#db2777', '#d946ef', '#c026d3'],
        shadows: ['#be185d', '#9d174d', '#831843', '#701a75'],
        trunk: '#4e342e',
        branch: '#6d4c41',
        grass: '#4caf50',
        fallenLeaves: ['#f472b6', '#fbcfe8', '#fce7f3', '#db2777'],
        stoneLight: '#f7f2ea',
        stoneDark: '#ebe4d8',
      };
    case 'winter':
      return {
        highlights: ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd'],
        midtones: ['#38bdf8', '#0284c7', '#0369a1', '#0f766e'],
        shadows: ['#0c4a6e', '#115e59', '#1e293b', '#0f172a'],
        trunk: '#334155',
        branch: '#475569',
        grass: '#0f766e',
        fallenLeaves: ['#ffffff', '#bae6fd', '#38bdf8', '#e0f2fe'],
        stoneLight: '#f1f5f9',
        stoneDark: '#e2e8f0',
      };
    case 'cyberpunk':
      return {
        highlights: ['#00f5ff', '#38bdf8', '#67e8f9', '#a5f3fc'],
        midtones: ['#06b6d4', '#0891b2', '#d946ef', '#c026d3'],
        shadows: ['#0e7490', '#155e75', '#701a75', '#0f172a'],
        trunk: '#1e1b4b',
        branch: '#312e81',
        grass: '#00f5ff',
        fallenLeaves: ['#00f5ff', '#d946ef', '#a855f7'],
        stoneLight: '#1e293b',
        stoneDark: '#0f172a',
      };
    case 'summer':
    default:
      return {
        highlights: ['#a3e635', '#84cc16', '#65a30d', '#bef264'],
        midtones: ['#4ade80', '#22c55e', '#16a34a', '#15803d'],
        shadows: ['#166534', '#14532d', '#1e3a1f', '#2d4a22'],
        trunk: '#5d4037',
        branch: '#6d4c41',
        grass: '#4caf50',
        fallenLeaves: ['#84cc16', '#22c55e', '#16a34a', '#a3e635'],
        stoneLight: '#f6f1e7',
        stoneDark: '#eae3d5',
      };
  }
}

export const treeStyle: QRStyleGenerator = {
  id: 'tree',
  name: 'Sacred Seasonal Tree',
  vietnameseName: 'Cây Cổ Thụ Biến Hình QR',
  icon: '🌳',
  description: 'An interactive isometric seasonal tree whose leaves morph directly into a scannable mosaic QR code!',
  vietnameseDescription: 'Cây 3D sống động với lá cây tự động bay xuống xếp thành bức tranh mã QR nghệ thuật!',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;

    const palette = getSeasonalCanopyPalette(season.id);

    // Margin around QR code for quiet zone
    const quietMargin = 3;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const slabDepth = 1.0;

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_Tree';

    const toWorldPos = (row: number, col: number) => ({
      x: (col - (N - 1) / 2) * moduleSize,
      z: (row - (N - 1) / 2) * moduleSize,
    });

    // ==========================================
    // 1. ISOMETRIC GARDEN PAVEMENT (Image 1)
    // ==========================================
    const groundGroup = new THREE.Group();
    groundGroup.name = 'GardenBase';

    // Base slab substrate
    const slabGeo = new THREE.BoxGeometry(sceneSize, slabDepth, sceneSize);
    const slabMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.stoneDark),
      roughness: 0.9,
      metalness: 0.05,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -slabDepth / 2;
    slabMesh.receiveShadow = true;
    groundGroup.add(slabMesh);

    // Warm cream paving floor
    const topFloorGeo = new THREE.BoxGeometry(sceneSize * 0.998, 0.04, sceneSize * 0.998);
    const topFloorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.stoneLight),
      roughness: 0.5,
      metalness: 0.0,
    });
    const topFloor = new THREE.Mesh(topFloorGeo, topFloorMat);
    topFloor.position.y = 0.02;
    topFloor.receiveShadow = true;
    groundGroup.add(topFloor);

    // Individual paving stone tiles for subtle texture
    const stoneTileGeo = new THREE.BoxGeometry(moduleSize * 0.98, 0.015, moduleSize * 0.98);
    const stoneMat = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.0,
    });

    let lightTileCount = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) lightTileCount++;
      }
    }

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
          dummyTile.position.set(x, 0.025, z);
          dummyTile.updateMatrix();
          lightTilesMesh.setMatrixAt(ltIdx, dummyTile.matrix);

          // Subtle natural variation in paving stones
          const tint = (r * 3 + c * 7) % 5 === 0 ? colorB : colorA;
          lightTilesMesh.setColorAt(ltIdx, tint);
          ltIdx++;
        }
      }
    }
    lightTilesMesh.instanceMatrix.needsUpdate = true;
    if (lightTilesMesh.instanceColor) lightTilesMesh.instanceColor.needsUpdate = true;
    groundGroup.add(lightTilesMesh);

    // Fallen petals / leaves scattered on the patio (From Image 1!)
    const fallenGroup = new THREE.Group();
    fallenGroup.name = 'FallenLeaves';
    const fallenLeafGeo = new THREE.BoxGeometry(moduleSize * 0.45, 0.02, moduleSize * 0.35);
    const fallenCount = 18;

    for (let i = 0; i < fallenCount; i++) {
      const angle = rng.angle();
      const dist = rng.range(moduleSize * 2, moduleSize * 8);
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;

      const fColor = rng.choice(palette.fallenLeaves);
      const fMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(fColor),
        roughness: 0.6,
      });
      const fMesh = new THREE.Mesh(fallenLeafGeo, fMat);
      fMesh.position.set(fx, 0.038, fz);
      fMesh.rotation.y = rng.angle();
      fMesh.scale.set(rng.range(0.8, 1.3), 1, rng.range(0.8, 1.3));
      fallenGroup.add(fMesh);
    }
    groundGroup.add(fallenGroup);

    rootGroup.add(groundGroup);

    // ==========================================
    // 2. LUSH MULTI-BLADE GRASS CLUMPS (Image 1)
    // ==========================================
    const grassGroup = new THREE.Group();
    grassGroup.name = 'GrassBorders';

    // Grass blade geometry: tapered curved flat triangle
    const bladeGeo = new THREE.ConeGeometry(0.12, 0.9, 3);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.grass),
      roughness: 0.55,
      metalness: 0.05,
    });

    // Create lush clumps of grass at the corners and along the perimeter
    const clumpPositions: { x: number; z: number; count: number }[] = [];
    const cornerOffset = sceneSize * 0.44;

    // Corner clusters (rich clusters as seen in Image 1)
    const corners = [
      { x: -cornerOffset, z: -cornerOffset },
      { x: cornerOffset, z: -cornerOffset },
      { x: -cornerOffset, z: cornerOffset },
      { x: cornerOffset, z: cornerOffset },
      { x: 0, z: -cornerOffset },
      { x: 0, z: cornerOffset },
      { x: -cornerOffset, z: 0 },
      { x: cornerOffset, z: 0 },
    ];

    for (const c of corners) {
      clumpPositions.push({ x: c.x, z: c.z, count: rng.int(10, 16) });
    }

    for (const clump of clumpPositions) {
      for (let b = 0; b < clump.count; b++) {
        const angle = rng.angle();
        const dist = rng.range(0.2, 1.8);
        const bx = clump.x + Math.cos(angle) * dist;
        const bz = clump.z + Math.sin(angle) * dist;
        const bHeight = rng.range(0.65, 1.35);

        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(bx, bHeight / 2 + 0.02, bz);
        blade.scale.set(rng.range(0.8, 1.5), bHeight, rng.range(0.8, 1.5));
        blade.rotation.set(
          rng.range(-0.35, 0.35),
          rng.angle(),
          rng.range(-0.35, 0.35)
        );
        blade.castShadow = true;
        grassGroup.add(blade);
      }
    }
    rootGroup.add(grassGroup);

    // ==========================================
    // 3. TALL ORGANIC TREE TRUNK & BRANCHES
    // ==========================================
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'TreeTrunk';

    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.trunk),
      roughness: 0.8,
      metalness: 0.05,
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.branch),
      roughness: 0.75,
      metalness: 0.05,
    });

    // Tall, elegant trunk reaching up into the canopy
    const trunkHeight = rng.range(8.5, 10.5);
    const trunkBaseR = moduleSize * 0.9;
    const trunkSegments = 6;
    const segH = trunkHeight / trunkSegments;

    let curX = 0;
    let curZ = 0;
    let curR = trunkBaseR;
    const canopyAnchors: { x: number; y: number; z: number; radius: number }[] = [];

    for (let s = 0; s < trunkSegments; s++) {
      const topR = curR * 0.84;
      const yPos = s * segH + segH / 2;
      const segGeo = new THREE.CylinderGeometry(topR, curR, segH, 7);
      const seg = new THREE.Mesh(segGeo, trunkMat);
      seg.position.set(curX, yPos, curZ);
      seg.castShadow = true;
      trunkGroup.add(seg);

      curR = topR;
      curX += rng.range(-0.1, 0.1);
      curZ += rng.range(-0.1, 0.1);

      if (s >= 2) {
        canopyAnchors.push({
          x: curX,
          y: yPos + segH / 2,
          z: curZ,
          radius: rng.range(2.5, 3.8),
        });
      }
    }

    // Branching network winding through canopy (From Image 1!)
    const numMajorBranches = rng.int(5, 7);
    for (let b = 0; b < numMajorBranches; b++) {
      const bAngle = (b / numMajorBranches) * Math.PI * 2 + rng.range(-0.3, 0.3);
      const startAnchor = rng.choice(canopyAnchors);
      const bLength = rng.range(3.5, 5.5);
      const bTilt = rng.range(0.3, 0.65);

      const endX = startAnchor.x + Math.cos(bAngle) * bLength;
      const endZ = startAnchor.z + Math.sin(bAngle) * bLength;
      const endY = startAnchor.y + bLength * bTilt;

      const midX = (startAnchor.x + endX) / 2;
      const midY = (startAnchor.y + endY) / 2;
      const midZ = (startAnchor.z + endZ) / 2;

      const bGeo = new THREE.CylinderGeometry(
        0.18 * moduleSize,
        0.38 * moduleSize,
        bLength,
        5
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
        radius: rng.range(2.2, 3.6),
      });

      // Smaller sub-branch twigs
      if (rng.chance(0.6)) {
        const subLength = rng.range(1.5, 2.5);
        const subAngle = bAngle + rng.range(-0.5, 0.5);
        const subEndX = endX + Math.cos(subAngle) * subLength;
        const subEndZ = endZ + Math.sin(subAngle) * subLength;
        const subEndY = endY + rng.range(0.5, 1.4);

        const subMidX = (endX + subEndX) / 2;
        const subMidY = (endY + subEndY) / 2;
        const subMidZ = (endZ + subEndZ) / 2;

        const subGeo = new THREE.CylinderGeometry(
          0.1 * moduleSize,
          0.18 * moduleSize,
          subLength,
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
          radius: rng.range(1.8, 2.8),
        });
      }
    }

    // Top crown pinnacle
    canopyAnchors.push({
      x: curX,
      y: trunkHeight + rng.range(1.5, 2.5),
      z: curZ,
      radius: 3.2,
    });

    rootGroup.add(trunkGroup);

    // ==========================================
    // 4. LUSH TRANSFORMER: FOLIAGE <---> QR CODE
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

    const leafCount = darkModules.length;

    // Stylized beveled leaf / voxel geometry
    const leafGeo = new THREE.BoxGeometry(
      moduleSize * 1.002,
      moduleSize * 0.16,
      moduleSize * 1.002
    );

    const leafMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
    });

    const leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    leafMesh.name = 'MorphingLeaves';
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;

    const leafTransforms: LeafTransform[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < leafCount; i++) {
      const mod = darkModules[i];
      const { x: qrX, z: qrZ } = toWorldPos(mod.row, mod.col);

      // --- 2D QR Transform (Target State in QR mode) ---
      const qrPos = new THREE.Vector3(qrX, 0.035, qrZ);
      const qrRot = new THREE.Euler(0, 0, 0);
      const qrScale = new THREE.Vector3(1, 1, 1);

      // --- 3D Lush Tree Canopy Transform (Initial State in Tree mode) ---
      // Distribute organically across the vertical teardrop crown (Y from 4.5 to 14.5!)
      const anchor = canopyAnchors[i % canopyAnchors.length];
      const theta = rng.angle();
      const phi = Math.acos(rng.range(-1, 1));
      const dist = Math.cbrt(rng.next()) * anchor.radius;

      const treeX = anchor.x + dist * Math.sin(phi) * Math.cos(theta);
      // Tall voluminous foliage shape
      const treeY = Math.max(
        4.6,
        anchor.y + dist * Math.sin(phi) * Math.sin(theta) * 0.95
      );
      const treeZ = anchor.z + dist * Math.cos(phi);

      const treePos = new THREE.Vector3(treeX, treeY, treeZ);
      const treeRot = new THREE.Euler(
        rng.range(-0.35, 0.35),
        rng.angle(),
        rng.range(-0.35, 0.35)
      );

      // Slightly larger foliage quads for lush visual density
      const treeScale = new THREE.Vector3(
        rng.range(1.15, 1.65),
        rng.range(1.15, 1.65),
        rng.range(1.15, 1.65)
      );

      // Animation parameters
      const distFromCenter = Math.hypot(qrX, qrZ) / (sceneSize * 0.5);
      const delay = rng.range(0, 0.22) + distFromCenter * 0.16;
      const arcY = rng.range(2.5, 5.0);
      const spin = rng.range(3.0, 6.0) * (rng.chance(0.5) ? 1 : -1);

      leafTransforms.push({
        treePos,
        treeRot,
        treeScale,
        qrPos,
        qrRot,
        qrScale,
        delay,
        arcY,
        spin,
      });

      // --- Natural Canopy Gradient Coloring ---
      // Sunlit leaves at the top get bright highlights, lower/inner leaves get rich deep greens!
      let leafColorHex: string;

      if (mod.isFinder) {
        // High contrast for finder patterns
        leafColorHex = rng.choice(palette.shadows);
      } else {
        // Height-based natural gradient (Top = sunlit bright, Bottom = deep shadow)
        const heightNorm = THREE.MathUtils.clamp((treeY - 4.5) / 9.0, 0, 1);

        if (heightNorm > 0.72) {
          leafColorHex = rng.choice(palette.highlights);
        } else if (heightNorm > 0.35) {
          leafColorHex = rng.choice(palette.midtones);
        } else {
          leafColorHex = rng.choice(palette.shadows);
        }
      }

      leafMesh.setColorAt(i, new THREE.Color(leafColorHex));

      // Initial placement: 3D Tree Mode (progress = 0)
      dummy.position.copy(treePos);
      dummy.rotation.copy(treeRot);
      dummy.scale.copy(treeScale);
      dummy.updateMatrix();
      leafMesh.setMatrixAt(i, dummy.matrix);
    }

    leafMesh.instanceMatrix.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    rootGroup.add(leafMesh);

    // ==========================================
    // 5. MORPHING UPDATE FUNCTION
    // ==========================================
    rootGroup.updateMorph = (progress: number) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Trunk and Grass scale down as we morph into flat QR
      const decorScale = Math.max(0.0001, 1 - Math.pow(p, 1.3));
      trunkGroup.scale.set(decorScale, decorScale, decorScale);
      trunkGroup.visible = p < 0.98;

      grassGroup.scale.set(decorScale, decorScale, decorScale);
      grassGroup.visible = p < 0.98;

      fallenGroup.scale.set(decorScale, decorScale, decorScale);
      fallenGroup.visible = p < 0.98;

      // 2. Animate every leaf along its flight arc
      for (let i = 0; i < leafCount; i++) {
        const d = leafTransforms[i];

        const localT = THREE.MathUtils.clamp(
          (p - d.delay) / (1 - 0.38),
          0,
          1
        );

        // Smooth easeInOutCubic
        const ease =
          localT < 0.5
            ? 4 * localT * localT * localT
            : 1 - Math.pow(-2 * localT + 2, 3) / 2;

        const arc = Math.sin(localT * Math.PI) * d.arcY * (1 - p * 0.4);

        dummy.position.lerpVectors(d.treePos, d.qrPos, ease);
        dummy.position.y += arc;

        dummy.rotation.x = THREE.MathUtils.lerp(d.treeRot.x, d.qrRot.x, ease);
        dummy.rotation.y = THREE.MathUtils.lerp(
          d.treeRot.y + d.spin * (1 - ease),
          d.qrRot.y,
          ease
        );
        dummy.rotation.z = THREE.MathUtils.lerp(d.treeRot.z, d.qrRot.z, ease);

        dummy.scale.lerpVectors(d.treeScale, d.qrScale, ease);

        dummy.updateMatrix();
        leafMesh.setMatrixAt(i, dummy.matrix);
      }

      leafMesh.instanceMatrix.needsUpdate = true;
    };

    return rootGroup;
  },
};
