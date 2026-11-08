/**
 * SeasonQR - Base QR 3D Ground & Module Builder
 *
 * Generates the physical QR code ground plate and dark module voxel tiles
 * with optimized InstancedMesh rendering (1-2 draw calls for all QR modules).
 * Finder patterns are rendered with high-contrast materials for guaranteed scan reliability.
 */

import * as THREE from 'three';
import type { QRMatrix } from '../qrParser';
import type { SeasonTheme } from '../seasons';

export interface QRBaseLayout {
  group: THREE.Group;
  moduleSize: number;
  halfSize: number;
  qrHalf: number;
  slabDepth: number;
  moduleHeight: number;
  matrixSize: number;
  /** Translates a matrix (row, col) to 3D world (x, z) coordinates */
  toWorldPos: (row: number, col: number) => { x: number; z: number };
}

export interface QRBaseOptions {
  sceneSize?: number;
  slabDepth?: number;
  moduleHeight?: number;
  isFloating?: boolean;
}

export function buildQRBase(
  matrix: QRMatrix,
  season: SeasonTheme,
  options: QRBaseOptions = {}
): QRBaseLayout {
  const sceneSize = options.sceneSize ?? 24;
  const N = matrix.size;
  // Quiet zone margin (2 modules on each side of the QR code)
  const quietMargin = 2;
  const totalModules = N + quietMargin * 2;
  const moduleSize = sceneSize / totalModules;
  const halfSize = sceneSize / 2;
  const qrHalf = (N * moduleSize) / 2;
  const slabDepth = options.slabDepth ?? 1.4;
  const moduleHeight = options.moduleHeight ?? moduleSize * 0.4;

  const group = new THREE.Group();
  group.name = 'QRBase';

  const toWorldPos = (row: number, col: number) => ({
    x: (col - (N - 1) / 2) * moduleSize,
    z: (row - (N - 1) / 2) * moduleSize,
  });

  // 1. Base Slab (Ground substrate)
  const slabGeo = new THREE.BoxGeometry(
    sceneSize,
    slabDepth,
    sceneSize
  );
  // Slab sits with its top at y = 0
  const slabMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(season.ground.groundSlab),
    roughness: 0.85,
    metalness: 0.1,
  });
  const slabMesh = new THREE.Mesh(slabGeo, slabMat);
  slabMesh.position.y = -slabDepth / 2;
  slabMesh.receiveShadow = true;
  slabMesh.castShadow = true;
  group.add(slabMesh);

  // 2. Light Module Surface Plate (Top floor of QR code)
  const topPlateGeo = new THREE.BoxGeometry(
    sceneSize * 0.995,
    0.05,
    sceneSize * 0.995
  );
  const topPlateMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(season.ground.lightModule),
    roughness: 0.4,
    metalness: 0.05,
  });
  const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
  topPlate.position.y = 0.025;
  topPlate.receiveShadow = true;
  group.add(topPlate);

  // 3. Rim Accent Frame around slab
  const rimThickness = moduleSize * 0.35;
  const rimGeo = new THREE.BoxGeometry(
    sceneSize + rimThickness * 2,
    slabDepth * 0.3,
    sceneSize + rimThickness * 2
  );
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(season.ground.groundRim),
    roughness: 0.7,
    metalness: season.id === 'cyberpunk' ? 0.8 : 0.2,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.y = -slabDepth * 0.2;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 4. Instanced Meshes for Dark Modules:
  // Split into Finder Dark Modules (high contrast) and Standard Dark Modules
  let standardCount = 0;
  let finderCount = 0;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix.matrix[r][c]) {
        if (matrix.isFinder(r, c)) {
          finderCount++;
        } else {
          standardCount++;
        }
      }
    }
  }

  const moduleGeo = new THREE.BoxGeometry(
    moduleSize * 0.94,
    moduleHeight,
    moduleSize * 0.94
  );

  // Standard modules material
  const standardMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(season.ground.darkModule),
    roughness: 0.5,
    metalness: season.id === 'cyberpunk' ? 0.6 : 0.1,
    emissive:
      season.id === 'cyberpunk'
        ? new THREE.Color(season.ground.darkModule).multiplyScalar(0.2)
        : new THREE.Color(0x000000),
  });

  // Finder pattern dark modules material (high contrast guaranteed)
  const finderMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(season.ground.finderDark),
    roughness: 0.35,
    metalness: 0.15,
    emissive:
      season.id === 'cyberpunk'
        ? new THREE.Color(season.ground.finderDark).multiplyScalar(0.25)
        : new THREE.Color(0x000000),
  });

  const dummy = new THREE.Object3D();

  // Populate Standard Dark Modules
  if (standardCount > 0) {
    const standardMesh = new THREE.InstancedMesh(
      moduleGeo,
      standardMat,
      standardCount
    );
    standardMesh.castShadow = true;
    standardMesh.receiveShadow = true;

    let idx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (matrix.matrix[r][c] && !matrix.isFinder(r, c)) {
          const { x, z } = toWorldPos(r, c);
          dummy.position.set(x, moduleHeight / 2 + 0.04, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          standardMesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }
    standardMesh.instanceMatrix.needsUpdate = true;
    group.add(standardMesh);
  }

  // Populate Finder Dark Modules
  if (finderCount > 0) {
    const finderMesh = new THREE.InstancedMesh(
      moduleGeo,
      finderMat,
      finderCount
    );
    finderMesh.castShadow = true;
    finderMesh.receiveShadow = true;

    let idx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (matrix.matrix[r][c] && matrix.isFinder(r, c)) {
          const { x, z } = toWorldPos(r, c);
          dummy.position.set(x, moduleHeight / 2 + 0.04, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          finderMesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }
    finderMesh.instanceMatrix.needsUpdate = true;
    group.add(finderMesh);
  }

  return {
    group,
    moduleSize,
    halfSize,
    qrHalf,
    slabDepth,
    moduleHeight,
    matrixSize: N,
    toWorldPos,
  };
}
