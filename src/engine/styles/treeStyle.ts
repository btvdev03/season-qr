/**
 * SeasonQR - Magical Leaf-to-QR Transformer Engine
 *
 * Implements the signature mechanic of ICQR Magic Tree:
 * - In 3D Tree Mode: A lush, isometric seasonal tree standing on a garden stone plot
 *   surrounded by decorative grass tufts.
 * - In QR Mode: The leaves dynamically fly down and assemble into an ARTISTIC
 *   ORGANIC MOSAIC QR CODE (multi-shade foliage tiles) that is 100% scannable!
 * - Smooth morphing: Each leaf has its own organic arc flight path and stagger delay.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableTreeGroup extends THREE.Group {
  updateMorph?: (progress: number) => void;
}

interface LeafData {
  // 3D Tree Canopy transform
  treePos: THREE.Vector3;
  treeRot: THREE.Euler;
  treeScale: THREE.Vector3;

  // 2D Artistic QR Code transform
  qrPos: THREE.Vector3;
  qrRot: THREE.Euler;
  qrScale: THREE.Vector3;

  // Organic flight animation parameters
  delay: number;
  arcHeight: number;
  spinSpeed: number;
}

/**
 * Returns a vibrant organic palette for dark modules based on the season.
 * This gives the artistic pixel/voxel mosaic look seen in ICQR (multi-tone leaves).
 */
function getLeafMosaicPalette(seasonId: string): string[] {
  switch (seasonId) {
    case 'summer':
      return [
        '#1b5e20', // Forest green
        '#2e7d32', // Deep emerald
        '#388e3c', // Lush grass green
        '#43a047', // Fresh leaf green
        '#558b2f', // Olive green
        '#689f38', // Spring moss
        '#7cb342', // Lime accent
      ];
    case 'autumn':
      return [
        '#7f1d1d', // Deep wine red
        '#991b1b', // Maple crimson
        '#b91c1c', // Fiery scarlet
        '#c2410c', // Burnt orange
        '#d97706', // Golden amber
        '#b45309', // Russet brown
        '#eab308', // Autumn gold accent
      ];
    case 'winter':
      return [
        '#0f172a', // Midnight slate
        '#1e293b', // Deep frost blue
        '#0f766e', // Alpine spruce teal
        '#115e59', // Deep frozen pine
        '#0284c7', // Ice blue
        '#0369a1', // Glacier navy
        '#38bdf8', // Frost highlight
      ];
    case 'cyberpunk':
      return [
        '#050814', // Deep obsidian
        '#083344', // Dark cyan
        '#0e7490', // Cyan laser
        '#06b6d4', // Bright cyan
        '#701a75', // Dark neon magenta
        '#c026d3', // Neon fuchsia
        '#00f5ff', // Electric cyan
      ];
    case 'spring':
    default:
      return [
        '#4a1525', // Deep cherry plum
        '#6b213b', // Rich sakura bark/leaf
        '#882d4b', // Crimson rose
        '#ad335c', // Vibrant pink petal
        '#be185d', // Berry pink
        '#db2777', // Soft cherry bloom
        '#f472b6', // Light petal accent
      ];
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

    // Quiet zone margin: 3 modules
    const quietMargin = 3;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const slabDepth = 1.2;

    const rootGroup = new THREE.Group() as MorphableTreeGroup;
    rootGroup.name = 'Style_Tree';

    const toWorldPos = (row: number, col: number) => ({
      x: (col - (N - 1) / 2) * moduleSize,
      z: (row - (N - 1) / 2) * moduleSize,
    });

    // ==========================================
    // 1. BASE STONE PAVEMENT SLAB
    // ==========================================
    const groundGroup = new THREE.Group();
    groundGroup.name = 'GroundBase';

    // Base Slab
    const slabGeo = new THREE.BoxGeometry(sceneSize, slabDepth, sceneSize);
    const slabMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.id === 'cyberpunk' ? '#0f172a' : '#d8d2c4'),
      roughness: 0.85,
      metalness: 0.05,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -slabDepth / 2;
    slabMesh.receiveShadow = true;
    groundGroup.add(slabMesh);

    // Top Stone Plate (Warm cream / stone pavement)
    const topPlateGeo = new THREE.BoxGeometry(sceneSize * 0.996, 0.04, sceneSize * 0.996);
    const topPlateMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.ground.lightModule),
      roughness: 0.35,
      metalness: 0.0,
    });
    const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
    topPlate.position.y = 0.02;
    topPlate.receiveShadow = true;
    groundGroup.add(topPlate);

    // Stone Rim Edge
    const rimThickness = moduleSize * 0.35;
    const rimGeo = new THREE.BoxGeometry(
      sceneSize + rimThickness * 2,
      slabDepth * 0.25,
      sceneSize + rimThickness * 2
    );
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.id === 'cyberpunk' ? '#06b6d4' : '#b8b09e'),
      roughness: 0.75,
      metalness: season.id === 'cyberpunk' ? 0.8 : 0.1,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -slabDepth * 0.18;
    rimMesh.receiveShadow = true;
    groundGroup.add(rimMesh);

    // Subtle checkered stone pattern for light modules in QR area
    // (creates that authentic patio paving look from ICQR)
    const stoneTileGeo = new THREE.BoxGeometry(moduleSize * 0.98, 0.015, moduleSize * 0.98);
    const lightStoneMatA = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.ground.lightModule),
      roughness: 0.4,
    });
    const lightStoneMatB = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.id === 'cyberpunk' ? '#111827' : '#ece6d8'),
      roughness: 0.45,
    });

    let lightTileCount = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) lightTileCount++;
      }
    }

    const lightTilesMesh = new THREE.InstancedMesh(stoneTileGeo, lightStoneMatA, lightTileCount);
    lightTilesMesh.receiveShadow = true;
    const dummyTile = new THREE.Object3D();
    let ltIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyTile.position.set(x, 0.025, z);
          dummyTile.updateMatrix();
          lightTilesMesh.setMatrixAt(ltIdx, dummyTile.matrix);
          // Alternate subtle tint for stone paving look
          const tileColor = (r + c) % 2 === 0 ? lightStoneMatA.color : lightStoneMatB.color;
          lightTilesMesh.setColorAt(ltIdx, tileColor);
          ltIdx++;
        }
      }
    }
    lightTilesMesh.instanceMatrix.needsUpdate = true;
    if (lightTilesMesh.instanceColor) lightTilesMesh.instanceColor.needsUpdate = true;
    groundGroup.add(lightTilesMesh);

    rootGroup.add(groundGroup);

    // ==========================================
    // 2. PERIMETER GARDEN GRASS CLUMPS (From Image 1)
    // ==========================================
    const grassGroup = new THREE.Group();
    grassGroup.name = 'GrassBorders';

    const grassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.id === 'cyberpunk' ? '#00f5ff' : '#4caf50'),
      roughness: 0.6,
      metalness: season.id === 'cyberpunk' ? 0.5 : 0.05,
    });
    const grassTuftGeo = new THREE.ConeGeometry(0.18, 0.75, 4);

    const perimeterRadius = sceneSize * 0.46;
    const grassCount = 42;
    for (let i = 0; i < grassCount; i++) {
      const angle = (i / grassCount) * Math.PI * 2;
      // Concentrate grass in corners and along edges
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Box perimeter projection
      const maxC = Math.max(Math.abs(cos), Math.abs(sin));
      const gx = (cos / maxC) * perimeterRadius + rng.range(-0.3, 0.3);
      const gz = (sin / maxC) * perimeterRadius + rng.range(-0.3, 0.3);
      const gHeight = rng.range(0.6, 1.1);

      const tuft = new THREE.Mesh(grassTuftGeo, grassMat);
      tuft.position.set(gx, gHeight / 2 + 0.02, gz);
      tuft.scale.set(rng.range(0.8, 1.4), gHeight, rng.range(0.8, 1.4));
      tuft.rotation.set(rng.range(-0.15, 0.15), rng.angle(), rng.range(-0.15, 0.15));
      tuft.castShadow = true;
      tuft.receiveShadow = true;
      grassGroup.add(tuft);
    }
    rootGroup.add(grassGroup);

    // ==========================================
    // 3. TREE TRUNK & BRANCHES
    // ==========================================
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'TreeTrunk';

    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.trunkPrimary),
      roughness: 0.85,
      metalness: season.id === 'cyberpunk' ? 0.4 : 0.05,
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.trunkSecondary),
      roughness: 0.8,
      metalness: season.id === 'cyberpunk' ? 0.5 : 0.05,
    });

    const trunkHeight = rng.range(7.0, 8.8);
    const trunkRadius = moduleSize * 0.85;

    // Slender organic central trunk
    const trunkSegments = 5;
    const segH = trunkHeight / trunkSegments;
    let curX = 0;
    let curZ = 0;
    let curR = trunkRadius;
    const branchAnchors: { x: number; y: number; z: number }[] = [];

    for (let s = 0; s < trunkSegments; s++) {
      const topR = curR * 0.86;
      const yPos = s * segH + segH / 2;
      const segGeo = new THREE.CylinderGeometry(topR, curR, segH, 6);
      const seg = new THREE.Mesh(segGeo, trunkMat);
      seg.position.set(curX, yPos, curZ);
      seg.castShadow = true;
      trunkGroup.add(seg);

      curR = topR;
      curX += rng.range(-0.08, 0.08);
      curZ += rng.range(-0.08, 0.08);

      if (s >= 2) {
        branchAnchors.push({ x: curX, y: yPos + segH / 2, z: curZ });
      }
    }

    // Branching out into canopy
    const branchTips: { x: number; y: number; z: number }[] = [];
    const numBranches = rng.int(4, 6);

    for (let b = 0; b < numBranches; b++) {
      const bAngle = (b / numBranches) * Math.PI * 2 + rng.range(-0.3, 0.3);
      const anchor = rng.choice(branchAnchors);
      const bLength = rng.range(3.2, 5.0);
      const bTilt = rng.range(0.25, 0.5);

      const endX = anchor.x + Math.cos(bAngle) * bLength;
      const endZ = anchor.z + Math.sin(bAngle) * bLength;
      const endY = anchor.y + bLength * bTilt;

      const midX = (anchor.x + endX) / 2;
      const midY = (anchor.y + endY) / 2;
      const midZ = (anchor.z + endZ) / 2;

      const bGeo = new THREE.CylinderGeometry(
        0.2 * moduleSize,
        0.4 * moduleSize,
        bLength,
        5
      );
      const bMesh = new THREE.Mesh(bGeo, branchMat);
      bMesh.position.set(midX, midY, midZ);
      bMesh.lookAt(endX, endY, endZ);
      bMesh.rotateX(Math.PI / 2);
      bMesh.castShadow = true;
      trunkGroup.add(bMesh);

      branchTips.push({ x: endX, y: endY, z: endZ });
    }

    // Top crown anchor
    branchTips.push({ x: curX, y: trunkHeight + 1.2, z: curZ });
    rootGroup.add(trunkGroup);

    // ==========================================
    // 4. THE TRANSFORMER: LEAVES <---> QR MODULES
    // ==========================================
    // Collect all dark modules from the QR code
    interface DarkModuleCoord {
      row: number;
      col: number;
      isFinder: boolean;
    }
    const darkModules: DarkModuleCoord[] = [];

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
    const leafGeo = new THREE.BoxGeometry(
      moduleSize * 1.002,
      moduleSize * 0.14,
      moduleSize * 1.002
    );

    const leafMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: season.id === 'cyberpunk' ? 0.5 : 0.05,
    });

    const leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    leafMesh.name = 'MorphingLeaves';
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;

    const mosaicPalette = getLeafMosaicPalette(season.id);
    const leafDataList: LeafData[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < leafCount; i++) {
      const mod = darkModules[i];
      const { x: qrX, z: qrZ } = toWorldPos(mod.row, mod.col);

      // --- 2D QR Transform (Target State in QR mode) ---
      const qrPos = new THREE.Vector3(qrX, 0.035, qrZ);
      const qrRot = new THREE.Euler(0, 0, 0);
      const qrScale = new THREE.Vector3(1, 1, 1);

      // --- 3D Tree Canopy Transform (Initial State in Tree mode) ---
      // Distribute leaves around branch tips and crown
      const tip = branchTips[i % branchTips.length];
      const clusterRadius = rng.range(1.5, 3.4);

      // Organic spherical distribution around canopy anchors
      const theta = rng.angle();
      const phi = Math.acos(rng.range(-1, 1));
      const dist = Math.cbrt(rng.next()) * clusterRadius;

      const treeX = tip.x + dist * Math.sin(phi) * Math.cos(theta);
      const treeY = Math.max(
        4.8,
        tip.y + dist * Math.sin(phi) * Math.sin(theta) * 0.8
      );
      const treeZ = tip.z + dist * Math.cos(phi);

      const treePos = new THREE.Vector3(treeX, treeY, treeZ);
      const treeRot = new THREE.Euler(
        rng.range(-0.35, 0.35),
        rng.angle(),
        rng.range(-0.35, 0.35)
      );
      const treeScale = new THREE.Vector3(
        rng.range(0.9, 1.3),
        rng.range(0.9, 1.3),
        rng.range(0.9, 1.3)
      );

      // --- Animation Parameters ---
      // Distance from center determines natural falling wave delay
      const centerDist = Math.hypot(qrX, qrZ) / (sceneSize * 0.5);
      const delay = rng.range(0, 0.25) + centerDist * 0.15; // 0..0.4 delay
      const arcHeight = rng.range(2.0, 4.5);
      const spinSpeed = rng.range(2.0, 5.0) * (rng.chance(0.5) ? 1 : -1);

      leafDataList.push({
        treePos,
        treeRot,
        treeScale,
        qrPos,
        qrRot,
        qrScale,
        delay,
        arcHeight,
        spinSpeed,
      });

      // --- Color Assignment ---
      // Finder patterns use deep, high-contrast dark green / dark theme color
      // Normal modules use the rich mosaic palette
      let colorHex: string;
      if (mod.isFinder) {
        colorHex = season.ground.finderDark;
      } else {
        // Sample mosaic palette with deterministic variation
        const colorIdx = rng.int(0, mosaicPalette.length - 1);
        colorHex = mosaicPalette[colorIdx];
      }
      leafMesh.setColorAt(i, new THREE.Color(colorHex));

      // Initial placement: 3D Tree state (t = 0)
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
    /**
     * progress = 0: 100% 3D Tree Mode (Isometric lush diorama)
     * progress = 1: 100% Artistic Mosaic QR Code (Flat scannable mosaic)
     */
    rootGroup.updateMorph = (progress: number) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      // 1. Trunk and Grass scale down as we enter QR mode
      const decorScale = Math.max(0.0001, 1 - Math.pow(p, 1.4));
      trunkGroup.scale.set(decorScale, decorScale, decorScale);
      trunkGroup.visible = p < 0.98;

      grassGroup.scale.set(decorScale, decorScale, decorScale);
      grassGroup.visible = p < 0.98;

      // 2. Animate each leaf along its flight path
      for (let i = 0; i < leafCount; i++) {
        const d = leafDataList[i];

        // Individual leaf progress with staggered delay
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

        // Flying arc in Y
        const arcY = Math.sin(localT * Math.PI) * d.arcHeight * (1 - p * 0.5);

        // Position interpolation
        dummy.position.lerpVectors(d.treePos, d.qrPos, ease);
        dummy.position.y += arcY;

        // Rotation interpolation (leaves spin as they flutter down and flatten at end)
        dummy.rotation.x = THREE.MathUtils.lerp(d.treeRot.x, d.qrRot.x, ease);
        dummy.rotation.y = THREE.MathUtils.lerp(
          d.treeRot.y + d.spinSpeed * (1 - ease),
          d.qrRot.y,
          ease
        );
        dummy.rotation.z = THREE.MathUtils.lerp(d.treeRot.z, d.qrRot.z, ease);

        // Scale interpolation
        dummy.scale.lerpVectors(d.treeScale, d.qrScale, ease);

        dummy.updateMatrix();
        leafMesh.setMatrixAt(i, dummy.matrix);
      }

      leafMesh.instanceMatrix.needsUpdate = true;
    };

    return rootGroup;
  },
};
