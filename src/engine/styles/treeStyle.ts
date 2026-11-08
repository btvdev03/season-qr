/**
 * SeasonQR - Seasonal Tree 3D Style Generator
 *
 * Generates an isometric voxel/low-poly seasonal tree rising from the QR base.
 * - Center trunk footprint is compact (radius ~2 modules), safely preserving QR error recovery.
 * - Branches & foliage are elevated above Y = 6 so the QR base remains scannable.
 * - Foliage & accents use THREE.InstancedMesh for 60+ FPS performance.
 * - Procedural branching is deterministic based on the URL's FNV-1a hash seed.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';
import { buildQRBase } from './baseQRBuilder';

export const treeStyle: QRStyleGenerator = {
  id: 'tree',
  name: 'Sacred Seasonal Tree',
  vietnameseName: 'Cây Cổ Thụ Bốn Mùa',
  icon: '🌳',
  description: 'An ancient isometric seasonal tree towering over a scannable QR base.',
  vietnameseDescription: 'Cây cổ thụ thần thoại vươn mình trên phiến đá mã QR với tán lá theo mùa.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;

    const rootGroup = new THREE.Group();
    rootGroup.name = 'Style_Tree';

    // 1. Build Base QR Ground
    const baseLayout = buildQRBase(matrix, season, {
      sceneSize,
      slabDepth: 1.4,
    });
    rootGroup.add(baseLayout.group);

    // 2. Trunk Generation
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'TreeTrunk';

    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.trunkPrimary),
      roughness: 0.85,
      metalness: season.id === 'cyberpunk' ? 0.4 : 0.05,
    });
    const trunkSecMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.trunkSecondary),
      roughness: 0.8,
      metalness: season.id === 'cyberpunk' ? 0.6 : 0.1,
    });

    // Root flare voxels at ground level (anchored strictly around center, avoiding finder patterns)
    const rootFlareCount = 8;
    const flareRadius = baseLayout.moduleSize * 1.8;
    for (let i = 0; i < rootFlareCount; i++) {
      const angle = (i / rootFlareCount) * Math.PI * 2 + rng.range(-0.2, 0.2);
      const dist = rng.range(flareRadius * 0.7, flareRadius * 1.2);
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;
      const fHeight = rng.range(0.6, 1.2);
      const fWidth = rng.range(0.8, 1.3) * baseLayout.moduleSize;

      const flareGeo = new THREE.BoxGeometry(fWidth, fHeight, fWidth);
      const flareMesh = new THREE.Mesh(flareGeo, trunkSecMat);
      flareMesh.position.set(fx, fHeight / 2, fz);
      flareMesh.rotation.y = angle;
      flareMesh.castShadow = true;
      flareMesh.receiveShadow = true;
      trunkGroup.add(flareMesh);
    }

    // Main vertical trunk segments rising to height ~8-10
    const trunkHeight = rng.range(7.5, 9.5);
    const trunkSegments = 6;
    const segHeight = trunkHeight / trunkSegments;
    const branchTips: { x: number; y: number; z: number }[] = [];

    let currentX = 0;
    let currentZ = 0;
    let currentRadius = baseLayout.moduleSize * 1.4;

    for (let s = 0; s < trunkSegments; s++) {
      const yPos = s * segHeight + segHeight / 2;
      const segGeo = new THREE.CylinderGeometry(
        currentRadius * 0.88,
        currentRadius,
        segHeight,
        7
      );
      const segMesh = new THREE.Mesh(segGeo, trunkMat);
      segMesh.position.set(currentX, yPos, currentZ);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      trunkGroup.add(segMesh);

      // Organic trunk taper and subtle lean
      currentRadius *= 0.88;
      currentX += rng.range(-0.15, 0.15);
      currentZ += rng.range(-0.15, 0.15);
    }

    // 3. Branches branching out horizontally & upwards
    const branchCount = rng.int(4, 6);
    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b / branchCount) * Math.PI * 2 + rng.range(-0.3, 0.3);
      const bStartY = trunkHeight * rng.range(0.65, 0.9);
      const bLength = rng.range(3.2, 5.0);
      const bElevation = rng.range(0.2, 0.5); // upward tilt

      const bEndX = currentX + Math.cos(bAngle) * bLength;
      const bEndZ = currentZ + Math.sin(bAngle) * bLength;
      const bEndY = bStartY + bLength * bElevation;

      const midX = (currentX + bEndX) / 2;
      const midY = (bStartY + bEndY) / 2;
      const midZ = (currentZ + bEndZ) / 2;

      const branchGeo = new THREE.CylinderGeometry(
        0.28 * baseLayout.moduleSize,
        0.48 * baseLayout.moduleSize,
        bLength,
        5
      );
      const branchMesh = new THREE.Mesh(branchGeo, trunkSecMat);
      branchMesh.position.set(midX, midY, midZ);
      branchMesh.lookAt(bEndX, bEndY, bEndZ);
      branchMesh.rotateX(Math.PI / 2);
      branchMesh.castShadow = true;
      branchMesh.receiveShadow = true;
      trunkGroup.add(branchMesh);

      branchTips.push({ x: bEndX, y: bEndY, z: bEndZ });

      // Sub-branchlets
      const subX = bEndX + Math.cos(bAngle + 0.4) * rng.range(1.2, 2.0);
      const subZ = bEndZ + Math.sin(bAngle + 0.4) * rng.range(1.2, 2.0);
      const subY = bEndY + rng.range(0.4, 1.0);
      branchTips.push({ x: subX, y: subY, z: subZ });
    }

    // Top crown tip
    branchTips.push({
      x: currentX,
      y: trunkHeight + rng.range(1.0, 1.8),
      z: currentZ,
    });

    rootGroup.add(trunkGroup);

    // 4. Instanced Foliage & Accents
    // Gather cluster center positions around branch tips
    const foliageClusterCenters: {
      x: number;
      y: number;
      z: number;
      radius: number;
    }[] = [];

    for (const tip of branchTips) {
      foliageClusterCenters.push({
        x: tip.x,
        y: tip.y,
        z: tip.z,
        radius: rng.range(2.2, 3.4),
      });
    }

    // Additional volume filling crown clusters
    foliageClusterCenters.push({
      x: currentX,
      y: trunkHeight + 0.5,
      z: currentZ,
      radius: 3.5,
    });

    interface FoliageBlock {
      x: number;
      y: number;
      z: number;
      scale: number;
      isPrimary: boolean;
      isAccent: boolean;
    }

    const foliageBlocks: FoliageBlock[] = [];
    const blockSize = baseLayout.moduleSize * 0.9;

    for (const cluster of foliageClusterCenters) {
      const voxelCount = rng.int(22, 34);
      for (let v = 0; v < voxelCount; v++) {
        // Spherical distribution
        const theta = rng.angle();
        const phi = Math.acos(rng.range(-1, 1));
        const dist = Math.cbrt(rng.next()) * cluster.radius;

        const fx = cluster.x + dist * Math.sin(phi) * Math.cos(theta);
        const fy = cluster.y + dist * Math.sin(phi) * Math.sin(theta) * 0.8;
        const fz = cluster.z + dist * Math.cos(phi);

        // Keep leaves strictly above ground plane (Y >= 4.5) to avoid QR base obstruction
        if (fy < 4.5) continue;

        const isAccent = rng.chance(0.22);
        const isPrimary = !isAccent && rng.chance(0.65);

        foliageBlocks.push({
          x: fx,
          y: fy,
          z: fz,
          scale: rng.range(0.8, 1.25),
          isPrimary,
          isAccent,
        });
      }
    }

    // Split into Primary Leaves, Secondary Leaves, and Accents
    const primaryBlocks = foliageBlocks.filter((b) => b.isPrimary);
    const secondaryBlocks = foliageBlocks.filter((b) => !b.isPrimary && !b.isAccent);
    const accentBlocks = foliageBlocks.filter((b) => b.isAccent);

    // Leaf block geometry (beveled / dodecahedral or box)
    const leafGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

    const primaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.primary),
      roughness: 0.6,
      metalness: season.id === 'cyberpunk' ? 0.5 : 0.05,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color(season.foliage.primary).multiplyScalar(0.3)
          : new THREE.Color(0x000000),
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.secondary),
      roughness: 0.65,
      metalness: season.id === 'cyberpunk' ? 0.6 : 0.05,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color(season.foliage.secondary).multiplyScalar(0.3)
          : new THREE.Color(0x000000),
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.accent),
      roughness: 0.4,
      metalness: season.id === 'cyberpunk' ? 0.8 : 0.2,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color(season.foliage.accent).multiplyScalar(0.6)
          : season.id === 'spring'
          ? new THREE.Color('#ffe5ec').multiplyScalar(0.15)
          : new THREE.Color(0x000000),
    });

    const dummy = new THREE.Object3D();

    // Primary Leaves InstancedMesh
    if (primaryBlocks.length > 0) {
      const primMesh = new THREE.InstancedMesh(
        leafGeo,
        primaryMat,
        primaryBlocks.length
      );
      primMesh.castShadow = true;
      primMesh.receiveShadow = true;

      primaryBlocks.forEach((b, idx) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(
          rng.range(-0.15, 0.15),
          rng.range(0, Math.PI * 2),
          rng.range(-0.15, 0.15)
        );
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        primMesh.setMatrixAt(idx, dummy.matrix);
      });
      primMesh.instanceMatrix.needsUpdate = true;
      rootGroup.add(primMesh);
    }

    // Secondary Leaves InstancedMesh
    if (secondaryBlocks.length > 0) {
      const secMesh = new THREE.InstancedMesh(
        leafGeo,
        secondaryMat,
        secondaryBlocks.length
      );
      secMesh.castShadow = true;
      secMesh.receiveShadow = true;

      secondaryBlocks.forEach((b, idx) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(
          rng.range(-0.15, 0.15),
          rng.range(0, Math.PI * 2),
          rng.range(-0.15, 0.15)
        );
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        secMesh.setMatrixAt(idx, dummy.matrix);
      });
      secMesh.instanceMatrix.needsUpdate = true;
      rootGroup.add(secMesh);
    }

    // Accents InstancedMesh (Flower blossoms, fruits, snow caps, cyber nodes)
    if (accentBlocks.length > 0) {
      const accentGeo =
        season.id === 'summer'
          ? new THREE.SphereGeometry(blockSize * 0.45, 6, 6)
          : new THREE.BoxGeometry(
              blockSize * 0.75,
              blockSize * 0.75,
              blockSize * 0.75
            );

      const accMesh = new THREE.InstancedMesh(
        accentGeo,
        accentMat,
        accentBlocks.length
      );
      accMesh.castShadow = true;
      accMesh.receiveShadow = true;

      accentBlocks.forEach((b, idx) => {
        // Place accents slightly protruding on top/outer surface
        dummy.position.set(b.x, b.y + (season.id === 'winter' ? 0.35 : 0), b.z);
        dummy.rotation.set(
          rng.range(-0.2, 0.2),
          rng.range(0, Math.PI * 2),
          rng.range(-0.2, 0.2)
        );
        dummy.scale.set(b.scale * 0.9, b.scale * 0.9, b.scale * 0.9);
        dummy.updateMatrix();
        accMesh.setMatrixAt(idx, dummy.matrix);
      });
      accMesh.instanceMatrix.needsUpdate = true;
      rootGroup.add(accMesh);
    }

    return rootGroup;
  },
};
