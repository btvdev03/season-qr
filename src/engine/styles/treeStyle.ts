/**
 * SeasonQR - Botanical Living Tree & Dynamic Mosaic QR Transformer
 *
 * Faithfully recreates the viral aesthetic of ICQR Magic Tree:
 * 1. Living 3D Tree Mode:
 *    - Tall, lush, voluminous teardrop canopy (Y from 4.2 up to 15.5).
 *    - Real-time harmonic wind sway & leaf flutter physics (60 FPS).
 *    - Natural sunlit foliage color distribution (bright lime on top, emerald midtones, deep forest underneath).
 *    - Slender multi-forking warm wood branches weaving gracefully through the foliage.
 *    - Isometric stone paved patio with multi-blade grass tufts at corners and scattered fallen blossoms.
 *
 * 2. Signature Leaf-to-QR Flight Morph:
 *    - Leaves detach and fly along organic curved arcs down to the ground.
 *    - Trunk and grass scale down and disappear.
 *    - Leaves assemble into the exact artistic garden mosaic QR code (Image 4).
 *    - Modules touch seamlessly at 1.002 scale for 100% camera scannability.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
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

  // Real-time wind physics & flight animation dynamics
  phase: number;
  swayAmp: number;
  delay: number;
  arcY: number;
  spin: number;
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
      // Authentic ICQR Summer Theme (Reference Image 3 & 4)
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
    rootGroup.name = 'Style_LivingTree';

    const halfScene = sceneSize / 2;
    const toWorldPos = (r: number, c: number) => ({
      x: (c + 0.5) * moduleSize - halfScene,
      z: (r + 0.5) * moduleSize - halfScene,
    });

    // ==========================================
    // 1. ISOMETRIC GARDEN PATIO (Image 3)
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

    // Warm cream patio surface
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

    // Subtle stone tile textures
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

    // Fallen petals / leaves scattered on patio (Image 3)
    const fallenGroup = new THREE.Group();
    fallenGroup.name = 'FallenLeaves';
    const fallenLeafGeo = new THREE.PlaneGeometry(moduleSize * 0.5, moduleSize * 0.35);
    fallenLeafGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < 22; i++) {
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
    // 2. LUSH MULTI-BLADE CORNER GRASS TUFTS (Image 3)
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
      // 4 Corners (Dense tufts)
      [-halfScene * 0.94, -halfScene * 0.94],
      [halfScene * 0.94, -halfScene * 0.94],
      [-halfScene * 0.94, halfScene * 0.94],
      [halfScene * 0.94, halfScene * 0.94],
      // Border accents
      [0, -halfScene * 0.95],
      [0, halfScene * 0.95],
      [-halfScene * 0.95, 0],
      [halfScene * 0.95, 0],
    ];

    for (const [cx, cz] of clumpPositions) {
      const bladeCount = rng.int(10, 16);
      for (let b = 0; b < bladeCount; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const bx = cx + rng.range(-0.9, 0.9);
        const bz = cz + rng.range(-0.9, 0.9);
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
    // 3. TALL BOTANICAL TRUNK & SLENDER BRANCHES
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

    // Tall trunk rising into the canopy (Y = 0 to 11.5)
    const trunkHeight = 11.5;
    const trunkSegments = 8;
    const segH = trunkHeight / trunkSegments;
    let curX = 0;
    let curZ = 0;
    let curR = moduleSize * 0.85;

    const canopyAnchors: { x: number; y: number; z: number; radius: number }[] = [];

    for (let s = 0; s < trunkSegments; s++) {
      const topR = curR * 0.86;
      const yPos = s * segH + segH / 2;
      const segGeo = new THREE.CylinderGeometry(topR, curR, segH, 7);
      const seg = new THREE.Mesh(segGeo, trunkMat);
      seg.position.set(curX, yPos, curZ);
      seg.castShadow = true;
      trunkGroup.add(seg);

      curR = topR;
      curX += rng.range(-0.12, 0.12);
      curZ += rng.range(-0.12, 0.12);

      if (s >= 2) {
        canopyAnchors.push({
          x: curX,
          y: yPos + segH / 2,
          z: curZ,
          radius: rng.range(2.8, 4.2),
        });
      }
    }

    // Branching network winding outward & upward
    const numMajorBranches = 8;
    for (let b = 0; b < numMajorBranches; b++) {
      const bAngle = (b / numMajorBranches) * Math.PI * 2 + rng.range(-0.25, 0.25);
      const startAnchor = canopyAnchors[b % canopyAnchors.length];
      const bLength = rng.range(3.8, 5.8);
      const bTilt = rng.range(0.35, 0.65);

      const endX = startAnchor.x + Math.cos(bAngle) * bLength;
      const endZ = startAnchor.z + Math.sin(bAngle) * bLength;
      const endY = startAnchor.y + bLength * bTilt;

      const midX = (startAnchor.x + endX) / 2;
      const midY = (startAnchor.y + endY) / 2;
      const midZ = (startAnchor.z + endZ) / 2;

      const bGeo = new THREE.CylinderGeometry(
        0.14 * moduleSize,
        0.32 * moduleSize,
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
        radius: rng.range(2.6, 3.8),
      });

      // Smaller sub-branch twigs
      if (rng.chance(0.75)) {
        const subLength = rng.range(1.8, 2.8);
        const subAngle = bAngle + rng.range(-0.45, 0.45);
        const subEndX = endX + Math.cos(subAngle) * subLength;
        const subEndZ = endZ + Math.sin(subAngle) * subLength;
        const subEndY = endY + rng.range(0.6, 1.5);

        const subMidX = (endX + subEndX) / 2;
        const subMidY = (endY + subEndY) / 2;
        const subMidZ = (endZ + subEndZ) / 2;

        const subGeo = new THREE.CylinderGeometry(
          0.08 * moduleSize,
          0.14 * moduleSize,
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
          radius: rng.range(2.0, 3.2),
        });
      }
    }

    // Top pinnacle anchor
    canopyAnchors.push({
      x: curX,
      y: trunkHeight + 2.2,
      z: curZ,
      radius: 3.5,
    });

    rootGroup.add(trunkGroup);

    // ==========================================
    // 4. LIVING FOLIAGE & MOSAIC QR TRANSFORMER
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

    // Organic Leaf Card Geometry:
    // A double-sided plane oriented flat in the X-Z plane by default (facing +Y)
    const leafGeo = new THREE.PlaneGeometry(moduleSize, moduleSize);
    leafGeo.rotateX(-Math.PI / 2);

    const leafMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
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
      // Flat on the ground at Y = 0.038, facing straight up (+Y)
      const qrPos = new THREE.Vector3(qrX, 0.038, qrZ);
      const qrRot = new THREE.Euler(0, 0, 0);
      const qrScale = new THREE.Vector3(1.002, 1, 1.002); // 1.002 seamless connection

      // --- 3D Botanical Tree Canopy Transform (Image 3) ---
      // Distribute in a tall voluminous teardrop envelope (Y: 4.2 -> 15.5)
      let treeX = 0;
      let treeY = 0;
      let treeZ = 0;

      if (rng.chance(0.65)) {
        // Clustered around organic branch anchors
        const anchor = rng.choice(canopyAnchors);
        const theta = rng.angle();
        const phi = Math.acos(rng.range(-1, 1));
        const dist = Math.cbrt(rng.next()) * anchor.radius;

        treeX = anchor.x + dist * Math.sin(phi) * Math.cos(theta);
        treeY = Math.max(4.2, anchor.y + dist * Math.sin(phi) * Math.sin(theta) * 0.95);
        treeZ = anchor.z + dist * Math.cos(phi);
      } else {
        // Distributed along the full botanical teardrop envelope
        const normH = rng.range(0.05, 0.98); // 0 -> 1 along canopy height
        treeY = 4.2 + normH * 11.2; // 4.2 to 15.4

        // Teardrop profile radius formula
        const profileR = 5.8 * Math.sin(Math.pow(normH, 0.72) * Math.PI) * (1.1 - 0.35 * normH);
        const rDist = Math.sqrt(rng.range(0.3, 1.0)) * profileR;
        const theta = rng.angle();

        treeX = Math.cos(theta) * rDist + rng.range(-0.4, 0.4);
        treeZ = Math.sin(theta) * rDist + rng.range(-0.4, 0.4);
      }

      const treePos = new THREE.Vector3(treeX, treeY, treeZ);

      // Organic foliage tilt & angle in 3D tree mode
      const treeRot = new THREE.Euler(
        rng.range(-0.7, 0.7),
        rng.angle(),
        rng.range(-0.7, 0.7)
      );

      // Lush foliage scale in tree mode (1.45 to 1.85 moduleSize)
      const sFactor = rng.range(1.45, 1.85);
      const treeScale = new THREE.Vector3(sFactor, 1, sFactor);

      // Animation & Wind dynamics
      const distFromCenter = Math.hypot(qrX, qrZ) / (sceneSize * 0.5);
      const delay = rng.range(0, 0.22) + distFromCenter * 0.16;
      const arcY = rng.range(3.0, 5.5);
      const spin = rng.range(3.5, 7.0) * (rng.chance(0.5) ? 1 : -1);
      const phase = rng.range(0, Math.PI * 2);
      const swayAmp = rng.range(0.25, 0.45);

      leafTransforms.push({
        treePos,
        treeRot,
        treeScale,
        qrPos,
        qrRot,
        qrScale,
        phase,
        swayAmp,
        delay,
        arcY,
        spin,
      });

      // --- Natural Canopy Sunlit Gradient & Mosaic Color Palette ---
      let leafColorHex: string;
      if (mod.isFinder) {
        // High contrast dark tone for finder patterns (ensures instant phone lock)
        leafColorHex = rng.choice(palette.shadows);
      } else {
        // Height-based sunlight gradient:
        // Top crown = bright sunlit lime/highlights
        // Middle = fresh lush emerald midtones
        // Underneath/interior = deep forest shadow
        const heightNorm = THREE.MathUtils.clamp((treeY - 4.2) / 10.5, 0, 1);
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
    // 5. REAL-TIME WIND SWAY & MORPH ANIMATION
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

      // Wind sway factor: full strength at p = 0, gracefully damped to 0 at p = 1
      const windFactor = Math.pow(Math.max(0, 1 - p), 2.2);

      // 2. Animate every leaf with wind physics + flight arc
      for (let i = 0; i < leafCount; i++) {
        const d = leafTransforms[i];

        // Harmonic wind sway (higher leaves sway more with gentle breeze)
        const heightFactor = Math.max(0.12, (d.treePos.y - 3.5) / 11.0);
        const swayX = Math.sin(time * 2.2 + d.phase + d.treePos.y * 0.35) * d.swayAmp * heightFactor;
        const swayZ = Math.cos(time * 1.8 + d.phase + d.treePos.x * 0.35) * d.swayAmp * heightFactor;
        const swayY = Math.sin(time * 3.1 + d.phase) * (d.swayAmp * 0.35) * heightFactor;

        // Rotational flutter
        const flutterRoll = Math.sin(time * 3.8 + d.phase) * 0.18 * heightFactor;
        const flutterPitch = Math.cos(time * 2.9 + d.phase) * 0.14 * heightFactor;

        // Flight progress (staggered by radial distance)
        const localT = THREE.MathUtils.clamp(
          (p - d.delay) / (1 - 0.36),
          0,
          1
        );

        // Smooth easeInOutCubic
        const ease =
          localT < 0.5
            ? 4 * localT * localT * localT
            : 1 - Math.pow(-2 * localT + 2, 3) / 2;

        const arc = Math.sin(localT * Math.PI) * d.arcY * (1 - p * 0.35);

        // Interpolate Position: Tree (with wind sway) -> QR Position
        dummy.position.x = THREE.MathUtils.lerp(d.treePos.x + swayX * windFactor, d.qrPos.x, ease);
        dummy.position.y = THREE.MathUtils.lerp(d.treePos.y + swayY * windFactor, d.qrPos.y, ease) + arc;
        dummy.position.z = THREE.MathUtils.lerp(d.treePos.z + swayZ * windFactor, d.qrPos.z, ease);

        // Interpolate Rotation: Tree (with flutter) -> Flat QR (0, 0, 0)
        dummy.rotation.x = THREE.MathUtils.lerp(d.treeRot.x + flutterPitch * windFactor, d.qrRot.x, ease);
        dummy.rotation.y = THREE.MathUtils.lerp(
          d.treeRot.y + d.spin * (1 - ease),
          d.qrRot.y,
          ease
        );
        dummy.rotation.z = THREE.MathUtils.lerp(d.treeRot.z + flutterRoll * windFactor, d.qrRot.z, ease);

        // Interpolate Scale: Lush Tree scale (1.6) -> Seamless QR scale (1.002)
        dummy.scale.lerpVectors(d.treeScale, d.qrScale, ease);

        dummy.updateMatrix();
        leafMesh.setMatrixAt(i, dummy.matrix);
      }

      leafMesh.instanceMatrix.needsUpdate = true;
    };

    return rootGroup;
  },
};
