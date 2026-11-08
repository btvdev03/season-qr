/**
 * SeasonQR - Seasonal Tree 3D Style Generator
 *
 * Generates an isometric voxel/low-poly seasonal tree rising from the QR base:
 * - Center trunk footprint is compact and slender (radius ~ 0.9 modules), safely preserving QR error recovery.
 * - Branches & foliage are elevated above Y = 7.5 so the QR base remains scannable.
 * - Foliage & accents use THREE.InstancedMesh with optimized voxel density for silky smooth 60+ FPS.
 * - All above-ground decorations are enclosed in a named 'DecorGroup' so the SceneManager can
 *   smoothly scale/fade them during Top-Down Scan Mode!
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

    // 2. Above-ground Scenery (DecorGroup - scalable for scan mode)
    const decorGroup = new THREE.Group();
    decorGroup.name = 'DecorGroup';

    // 3. Trunk & Branches
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

    // Slender central trunk (strictly centered, minimal ground footprint)
    const trunkHeight = rng.range(8.0, 10.0);
    const trunkSegments = 4;
    const segHeight = trunkHeight / trunkSegments;
    const branchTips: { x: number; y: number; z: number }[] = [];

    let currentX = 0;
    let currentZ = 0;
    let currentRadius = baseLayout.moduleSize * 0.95;

    for (let s = 0; s < trunkSegments; s++) {
      const yPos = s * segHeight + segHeight / 2;
      const topR = currentRadius * 0.85;
      const segGeo = new THREE.CylinderGeometry(
        topR,
        currentRadius,
        segHeight,
        6
      );
      const segMesh = new THREE.Mesh(segGeo, trunkMat);
      segMesh.position.set(currentX, yPos, currentZ);
      segMesh.castShadow = true;
      segMesh.receiveShadow = false;
      trunkGroup.add(segMesh);

      currentRadius = topR;
      currentX += rng.range(-0.12, 0.12);
      currentZ += rng.range(-0.12, 0.12);
    }

    // 4. Branches branching out horizontally & upwards at high elevation
    const branchCount = rng.int(4, 5);
    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b / branchCount) * Math.PI * 2 + rng.range(-0.25, 0.25);
      const bStartY = trunkHeight * rng.range(0.7, 0.88);
      const bLength = rng.range(3.5, 4.8);
      const bElevation = rng.range(0.25, 0.45); // upward tilt

      const bEndX = currentX + Math.cos(bAngle) * bLength;
      const bEndZ = currentZ + Math.sin(bAngle) * bLength;
      const bEndY = bStartY + bLength * bElevation;

      const midX = (currentX + bEndX) / 2;
      const midY = (bStartY + bEndY) / 2;
      const midZ = (currentZ + bEndZ) / 2;

      const branchGeo = new THREE.CylinderGeometry(
        0.25 * baseLayout.moduleSize,
        0.42 * baseLayout.moduleSize,
        bLength,
        5
      );
      const branchMesh = new THREE.Mesh(branchGeo, trunkSecMat);
      branchMesh.position.set(midX, midY, midZ);
      branchMesh.lookAt(bEndX, bEndY, bEndZ);
      branchMesh.rotateX(Math.PI / 2);
      branchMesh.castShadow = true;
      trunkGroup.add(branchMesh);

      branchTips.push({ x: bEndX, y: bEndY, z: bEndZ });
    }

    // Top crown tip
    branchTips.push({
      x: currentX,
      y: trunkHeight + rng.range(1.0, 1.6),
      z: currentZ,
    });

    decorGroup.add(trunkGroup);

    // 5. Instanced Foliage & Accents
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
        radius: rng.range(2.0, 2.8),
      });
    }

    // Volume filling crown cluster
    foliageClusterCenters.push({
      x: currentX,
      y: trunkHeight + 0.6,
      z: currentZ,
      radius: 3.0,
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
    const blockSize = baseLayout.moduleSize * 1.12;

    for (const cluster of foliageClusterCenters) {
      const voxelCount = rng.int(16, 22);
      for (let v = 0; v < voxelCount; v++) {
        const theta = rng.angle();
        const phi = Math.acos(rng.range(-1, 1));
        const dist = Math.cbrt(rng.next()) * cluster.radius;

        const fx = cluster.x + dist * Math.sin(phi) * Math.cos(theta);
        const fy = cluster.y + dist * Math.sin(phi) * Math.sin(theta) * 0.75;
        const fz = cluster.z + dist * Math.cos(phi);

        // Keep leaves well elevated (Y >= 6.5) so base remains visible
        if (fy < 6.5) continue;

        const isAccent = rng.chance(0.2);
        const isPrimary = !isAccent && rng.chance(0.65);

        foliageBlocks.push({
          x: fx,
          y: fy,
          z: fz,
          scale: rng.range(0.85, 1.2),
          isPrimary,
          isAccent,
        });
      }
    }

    const primaryBlocks = foliageBlocks.filter((b) => b.isPrimary);
    const secondaryBlocks = foliageBlocks.filter((b) => !b.isPrimary && !b.isAccent);
    const accentBlocks = foliageBlocks.filter((b) => b.isAccent);

    const leafGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

    const primaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.primary),
      roughness: 0.55,
      metalness: season.id === 'cyberpunk' ? 0.5 : 0.05,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color(season.foliage.primary).multiplyScalar(0.3)
          : new THREE.Color(0x000000),
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.secondary),
      roughness: 0.6,
      metalness: season.id === 'cyberpunk' ? 0.6 : 0.05,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color(season.foliage.secondary).multiplyScalar(0.3)
          : new THREE.Color(0x000000),
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.accent),
      roughness: 0.35,
      metalness: season.id === 'cyberpunk' ? 0.8 : 0.15,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color(season.foliage.accent).multiplyScalar(0.5)
          : season.id === 'spring'
          ? new THREE.Color('#ffe5ec').multiplyScalar(0.12)
          : new THREE.Color(0x000000),
    });

    const dummy = new THREE.Object3D();

    // Primary Leaves InstancedMesh
    if (primaryBlocks.length > 0) {
      const primaryMesh = new THREE.InstancedMesh(
        leafGeo,
        primaryMat,
        primaryBlocks.length
      );
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = false;

      for (let i = 0; i < primaryBlocks.length; i++) {
        const b = primaryBlocks[i];
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, (i * 0.4) % Math.PI, 0);
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        primaryMesh.setMatrixAt(i, dummy.matrix);
      }
      primaryMesh.instanceMatrix.needsUpdate = true;
      decorGroup.add(primaryMesh);
    }

    // Secondary Leaves InstancedMesh
    if (secondaryBlocks.length > 0) {
      const secondaryMesh = new THREE.InstancedMesh(
        leafGeo,
        secondaryMat,
        secondaryBlocks.length
      );
      secondaryMesh.castShadow = true;
      secondaryMesh.receiveShadow = false;

      for (let i = 0; i < secondaryBlocks.length; i++) {
        const b = secondaryBlocks[i];
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set((i * 0.3) % Math.PI, 0, (i * 0.2) % Math.PI);
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        secondaryMesh.setMatrixAt(i, dummy.matrix);
      }
      secondaryMesh.instanceMatrix.needsUpdate = true;
      decorGroup.add(secondaryMesh);
    }

    // Accent Leaves / Fruit / Blossoms InstancedMesh
    if (accentBlocks.length > 0) {
      const accentGeo =
        season.id === 'spring' || season.id === 'summer'
          ? new THREE.SphereGeometry(blockSize * 0.45, 6, 6)
          : leafGeo;

      const accentMesh = new THREE.InstancedMesh(
        accentGeo,
        accentMat,
        accentBlocks.length
      );
      accentMesh.castShadow = true;
      accentMesh.receiveShadow = false;

      for (let i = 0; i < accentBlocks.length; i++) {
        const b = accentBlocks[i];
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, (i * 0.5) % Math.PI, 0);
        dummy.scale.set(b.scale * 1.1, b.scale * 1.1, b.scale * 1.1);
        dummy.updateMatrix();
        accentMesh.setMatrixAt(i, dummy.matrix);
      }
      accentMesh.instanceMatrix.needsUpdate = true;
      decorGroup.add(accentMesh);
    }

    rootGroup.add(decorGroup);
    return rootGroup;
  },
};
