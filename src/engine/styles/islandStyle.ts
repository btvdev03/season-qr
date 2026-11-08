/**
 * SeasonQR - Floating Island 3D Style Generator
 *
 * Generates a floating seasonal voxel island:
 * - Base QR code forms the top lawn/stone surface plate.
 * - Inverted rock stalactites and dangling roots descend underneath into the void.
 * - Scattered seasonal props (mini bonsai, stone lanterns, mineral crystals, floating cloudlets)
 *   placed strictly outside finder pattern reserved zones.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';
import { buildQRBase } from './baseQRBuilder';

export const islandStyle: QRStyleGenerator = {
  id: 'island',
  name: 'Floating Voxel Island',
  vietnameseName: 'Đảo Nổi Bồng Bềnh',
  icon: '🏝️',
  description: 'A mystical floating island hovering in midair with stalactites and dangling roots.',
  vietnameseDescription: 'Hòn đảo thần thoại trôi lơ lửng giữa không trung với rễ cây cổ thụ rủ xuống đáy vực.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;

    const rootGroup = new THREE.Group();
    rootGroup.name = 'Style_FloatingIsland';

    // 1. Build Base QR Ground
    const baseLayout = buildQRBase(matrix, season, {
      sceneSize,
      slabDepth: 1.0,
      isFloating: true,
    });
    rootGroup.add(baseLayout.group);

    // 2. Under-Island Floating Rock Formations (Inverted Stalactites)
    const underGroup = new THREE.Group();
    underGroup.name = 'UnderIslandRocks';

    const rockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.rockPrimary),
      roughness: 0.9,
      metalness: season.id === 'cyberpunk' ? 0.5 : 0.05,
    });

    const rockSecMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.rockSecondary),
      roughness: 0.85,
      metalness: season.id === 'cyberpunk' ? 0.6 : 0.1,
    });

    // Layered tapering rock chunks beneath the slab (-Y)
    const layers = 6;
    const maxDepth = rng.range(7.0, 9.5);
    const halfWidth = sceneSize * 0.45;

    for (let l = 0; l < layers; l++) {
      const progress = (l + 1) / layers; // 0..1
      const layerY = -1.0 - progress * maxDepth;
      const currentRadius = halfWidth * Math.pow(1 - progress * 0.85, 1.3);
      const chunksInLayer = Math.max(3, Math.floor(10 * (1 - progress * 0.6)));

      for (let c = 0; c < chunksInLayer; c++) {
        const angle = (c / chunksInLayer) * Math.PI * 2 + rng.range(-0.3, 0.3);
        const dist = rng.range(0.2, currentRadius);
        const rx = Math.cos(angle) * dist;
        const rz = Math.sin(angle) * dist;

        const sizeX = rng.range(1.6, 3.2) * (1 - progress * 0.4);
        const sizeY = rng.range(1.2, 2.2);
        const sizeZ = rng.range(1.6, 3.2) * (1 - progress * 0.4);

        const chunkGeo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const mat = rng.chance(0.6) ? rockMat : rockSecMat;
        const chunkMesh = new THREE.Mesh(chunkGeo, mat);

        chunkMesh.position.set(rx, layerY, rz);
        chunkMesh.rotation.set(
          rng.range(-0.25, 0.25),
          rng.range(0, Math.PI * 2),
          rng.range(-0.25, 0.25)
        );
        chunkMesh.castShadow = true;
        chunkMesh.receiveShadow = true;
        underGroup.add(chunkMesh);
      }
    }

    // Hanging Roots descending from rock crevices
    const rootMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.trunkPrimary),
      roughness: 0.9,
    });

    const rootCount = rng.int(8, 14);
    for (let r = 0; r < rootCount; r++) {
      const angle = rng.angle();
      const dist = rng.range(halfWidth * 0.3, halfWidth * 0.8);
      const rootLen = rng.range(3.5, 7.0);

      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      const startY = -1.2;

      const rootGeo = new THREE.CylinderGeometry(
        0.1,
        0.28,
        rootLen,
        5
      );
      const rootMesh = new THREE.Mesh(rootGeo, rootMat);
      rootMesh.position.set(rx, startY - rootLen / 2, rz);
      rootMesh.rotation.set(
        rng.range(-0.2, 0.2),
        rng.range(0, Math.PI),
        rng.range(-0.2, 0.2)
      );
      rootMesh.castShadow = true;
      underGroup.add(rootMesh);
    }

    rootGroup.add(underGroup);

    // 3. Floating Sub-Rocks (Smaller fragments hovering off the corners)
    const floatGroup = new THREE.Group();
    floatGroup.name = 'FloatingDebris';

    const floatDebrisCount = rng.int(5, 8);
    for (let d = 0; d < floatDebrisCount; d++) {
      const angle = rng.angle();
      const dist = rng.range(sceneSize * 0.58, sceneSize * 0.75);
      const dy = rng.range(-3.5, 2.0);
      const dScale = rng.range(0.8, 1.8);

      const dGeo = new THREE.DodecahedronGeometry(dScale, 0);
      const dMesh = new THREE.Mesh(dGeo, rockSecMat);
      dMesh.position.set(Math.cos(angle) * dist, dy, Math.sin(angle) * dist);
      dMesh.rotation.set(rng.range(0, 3), rng.range(0, 3), rng.range(0, 3));
      dMesh.castShadow = true;
      floatGroup.add(dMesh);
    }
    rootGroup.add(floatGroup);

    // 4. Low-Profile Seasonal Flora on Top of Island
    // We deterministically pick safe non-reserved, non-finder modules
    const floraGroup = new THREE.Group();
    floraGroup.name = 'IslandFlora';

    // Mini Bonsai Tree in a safe quadrant (avoiding finder patterns)
    // Safe spot: e.g. bottom-right area (row ~ size - 5, col ~ size - 5)
    const safeCenterRow = Math.floor(matrix.size * 0.72);
    const safeCenterCol = Math.floor(matrix.size * 0.72);

    if (!matrix.isReserved(safeCenterRow, safeCenterCol)) {
      const { x, z } = baseLayout.toWorldPos(safeCenterRow, safeCenterCol);

      // Mini trunk
      const miniTrunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 2.8, 5);
      const miniTrunk = new THREE.Mesh(miniTrunkGeo, rootMat);
      miniTrunk.position.set(x, 1.4, z);
      miniTrunk.rotation.z = -0.15;
      miniTrunk.castShadow = true;
      floraGroup.add(miniTrunk);

      // Mini foliage canopy
      const miniCanopyGeo = new THREE.DodecahedronGeometry(1.6, 1);
      const miniCanopyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(season.foliage.primary),
        roughness: 0.6,
      });
      const miniCanopy = new THREE.Mesh(miniCanopyGeo, miniCanopyMat);
      miniCanopy.position.set(x - 0.4, 2.8, z);
      miniCanopy.castShadow = true;
      floraGroup.add(miniCanopy);

      // Accent blossom / fruit on mini tree
      const miniAccentGeo = new THREE.SphereGeometry(0.35, 5, 5);
      const miniAccentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(season.foliage.accent),
        roughness: 0.4,
      });
      const miniAccent = new THREE.Mesh(miniAccentGeo, miniAccentMat);
      miniAccent.position.set(x - 0.2, 3.4, z + 0.3);
      floraGroup.add(miniAccent);
    }

    // 5. Stylized Floating Low-Poly Clouds Hovering Near Island
    const cloudMat = new THREE.MeshStandardMaterial({
      color:
        season.id === 'cyberpunk'
          ? new THREE.Color('#38bdf8')
          : new THREE.Color('#ffffff'),
      roughness: 0.3,
      transparent: true,
      opacity: season.id === 'cyberpunk' ? 0.7 : 0.88,
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color('#0284c7').multiplyScalar(0.4)
          : new THREE.Color('#ffffff').multiplyScalar(0.08),
    });

    const cloudCount = 3;
    for (let c = 0; c < cloudCount; c++) {
      const cAngle = (c / cloudCount) * Math.PI * 2 + 0.5;
      const cDist = rng.range(sceneSize * 0.55, sceneSize * 0.7);
      const cY = rng.range(3.0, 5.5);
      const cGroup = new THREE.Group();

      const puffs = rng.int(3, 5);
      for (let p = 0; p < puffs; p++) {
        const pScale = rng.range(0.8, 1.4);
        const puffGeo = new THREE.DodecahedronGeometry(pScale, 1);
        const puffMesh = new THREE.Mesh(puffGeo, cloudMat);
        puffMesh.position.set(
          p * 0.8 - puffs * 0.4,
          rng.range(-0.2, 0.2),
          rng.range(-0.3, 0.3)
        );
        cGroup.add(puffMesh);
      }

      cGroup.position.set(
        Math.cos(cAngle) * cDist,
        cY,
        Math.sin(cAngle) * cDist
      );
      floraGroup.add(cGroup);
    }

    rootGroup.add(floraGroup);

    return rootGroup;
  },
};
