/**
 * SeasonQR - Floating Sky Island 3D Style Generator
 *
 * Transforms any QR code into a mystical Floating Sky Island (Đảo Bay Kỳ Ảo):
 * 1. 3D Isometric Mode (progress = 0):
 *    - Inverted rock stalactites and dangling roots descending beneath the island.
 *    - Orbiting sky-rock fragments and crystal shards levitating at 60 FPS.
 *    - QR dark modules form a 3D terraced mountain & valley relief on top of the island.
 *    - Hillside seasonal Sky Bonsai Tree, shimmering turquoise waterfall cascade,
 *      and drifting low-poly clouds.
 *
 * 2. 90° Top-Down Scan Mode (progress = 1):
 *    - All under-island stalactites, orbiting rocks, clouds, waterfall, and trees
 *      smoothly fold away while the 3D mountain terraces flatten into a razor-sharp
 *      QR code on a 100% pure luminous white (#ffffff) background.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableIslandGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface IslandModuleData {
  x: number;
  z: number;
  isFinder: boolean;
  delay: number;
  height3D: number;
  scaleXZ3D: number;
  color3D: THREE.Color;
  yFlat: number;
  scaleYFlat: number;
  scaleXZFlat: number;
  colorQR: THREE.Color;
}

interface IslandPaverModule {
  meadowColor: THREE.Color;
  scanColor: THREE.Color;
}

function hash2D(r: number, c: number): number {
  let h = (r * 374761393 + c * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const islandStyle: QRStyleGenerator = {
  id: 'island',
  name: 'Đảo Bay Kỳ Ảo',
  vietnameseName: 'Đảo Bay Kỳ Ảo',
  icon: '🏝️',
  description:
    'A mystical floating sky island with stalactites, terraced hills, waterfall cascade, and drifting clouds.',
  vietnameseDescription:
    'Kỳ quan đảo bay bồng bềnh giữa tầng mây với nhũ đá kỳ vĩ, thác nước ngọc bích và thung lũng 4 mùa.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const quietMargin = 2.5;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const cx = (N - 1) / 2;
    const cy = (N - 1) / 2;

    const rootGroup = new THREE.Group() as MorphableIslandGroup;
    rootGroup.name = 'Style_FloatingIsland';

    const toWorldPos = (r: number, c: number) => ({
      x: (c - cx) * moduleSize,
      z: (r - cy) * moduleSize,
    });

    // ==========================================
    // 1. FLOATING ISLAND TOP SLAB & MEADOW PAVERS
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'IslandTopPatio';

    const plinthHeight = 0.85;
    const plinthSize = sceneSize * 1.03;
    const plinthBaseCol = new THREE.Color(season.ground.groundSlab);
    const pureWhiteCol = new THREE.Color('#ffffff');

    const plinthGeo = new THREE.BoxGeometry(plinthSize, plinthHeight, plinthSize);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: plinthBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    patioGroup.add(plinthMesh);

    const paverBlockHeight = 0.12;
    const terraceBaseCol = new THREE.Color(season.ground.lightModule);
    const terraceBedGeo = new THREE.BoxGeometry(
      sceneSize,
      paverBlockHeight * 0.95,
      sceneSize
    );
    const terraceBedMat = new THREE.MeshStandardMaterial({
      color: terraceBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.75,
      metalness: 0.02,
    });
    const terraceBedMesh = new THREE.Mesh(terraceBedGeo, terraceBedMat);
    terraceBedMesh.position.y = paverBlockHeight / 2 - 0.005;
    terraceBedMesh.receiveShadow = true;
    patioGroup.add(terraceBedMesh);

    const paverBlockGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      paverBlockHeight,
      moduleSize * 0.988
    );
    const paverBlockMat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.65,
      metalness: 0.02,
      flatShading: true,
    });

    let lightCount = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) lightCount++;
      }
    }

    const lightPaversMesh = new THREE.InstancedMesh(
      paverBlockGeo,
      paverBlockMat,
      lightCount
    );
    lightPaversMesh.name = 'IslandLightPavers';
    lightPaversMesh.receiveShadow = true;

    const lightPaverModules: IslandPaverModule[] = [];
    const dummyPaver = new THREE.Object3D();
    const colLightA = new THREE.Color(season.ground.lightModule);
    const colLightB = colLightA.clone().offsetHSL(0, 0, -0.035);

    let lIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyPaver.position.set(x, paverBlockHeight / 2, z);
          dummyPaver.scale.set(1, 1, 1);
          dummyPaver.updateMatrix();
          lightPaversMesh.setMatrixAt(lIdx, dummyPaver.matrix);

          const mCol = (r * 5 + c * 7) % 3 === 0 ? colLightB : colLightA;
          lightPaverModules.push({
            meadowColor: mCol.clone(),
            scanColor: pureWhiteCol.clone(),
          });
          lightPaversMesh.setColorAt(lIdx, mCol);
          lIdx++;
        }
      }
    }
    lightPaversMesh.instanceMatrix.needsUpdate = true;
    if (lightPaversMesh.instanceColor) lightPaversMesh.instanceColor.needsUpdate = true;
    patioGroup.add(lightPaversMesh);
    rootGroup.add(patioGroup);

    // ==========================================
    // 2. 3D TERRACED HIGHLAND MOUNTAIN QR MODULES
    // ==========================================
    const islandModules: IslandModuleData[] = [];
    const foliagePrimary = new THREE.Color(season.foliage.primary);
    const foliageSec = new THREE.Color(season.foliage.secondary);
    const rockPrimary = new THREE.Color(season.structure.rockPrimary);
    const finderDarkCol = new THREE.Color(season.ground.finderDark);
    const darkModCol = new THREE.Color(season.ground.darkModule);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) continue;

        const { x, z } = toWorldPos(r, c);
        const isFinder = matrix.isFinder(r, c);
        const rnd = hash2D(r, c);
        const u = cx > 0 ? (c - cx) / cx : 0;
        const v = cy > 0 ? (r - cy) / cy : 0;
        const radialDist = Math.hypot(u, v);
        const delay = Math.min(0.24, radialDist * 0.16);

        const yFlat = paverBlockHeight / 2;
        const scaleYFlat = 1.0;
        const scaleXZFlat = 1.0;

        let height3D = paverBlockHeight;
        let scaleXZ3D = 0.94;
        let color3D: THREE.Color;
        let colorQR: THREE.Color;

        if (isFinder) {
          const dr = r < 7 ? r : r - (N - 7);
          const dc = c < 7 ? c : c - (N - 7);
          const cheb = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
          height3D = cheb === 0 ? 1.4 : cheb === 1 ? 0.9 : 0.45;
          scaleXZ3D = 0.96;
          color3D = finderDarkCol.clone();
          colorQR = finderDarkCol.clone();
        } else {
          // Terraced Highland Landscape (peak toward upper-left & center, valley stream on right)
          const hillDist = Math.hypot(u + 0.15, v + 0.15);
          const hillElevation = Math.max(0, 1 - hillDist * 0.9);
          const isRiverChannel = Math.abs(u - v * 0.6 - 0.25) < 0.16;

          if (isRiverChannel) {
            height3D = 0.32;
            color3D = new THREE.Color('#0284c7'); // Turquoise highland stream
            colorQR = darkModCol.clone();
          } else {
            height3D = 0.35 + Math.pow(hillElevation, 1.35) * 3.1 + rnd * 0.75;
            color3D =
              height3D > 2.1
                ? foliagePrimary.clone()
                : height3D > 1.1
                ? foliageSec.clone()
                : rockPrimary.clone();
            colorQR =
              rnd > 0.45
                ? darkModCol.clone()
                : finderDarkCol.clone().lerp(foliagePrimary, 0.2);
          }
        }

        islandModules.push({
          x,
          z,
          isFinder,
          delay,
          height3D,
          scaleXZ3D,
          color3D,
          yFlat,
          scaleYFlat,
          scaleXZFlat,
          colorQR,
        });
      }
    }

    const modCount = islandModules.length;
    const tileBaseHeight = paverBlockHeight * 1.15;
    const modGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      tileBaseHeight,
      moduleSize * 0.988
    );
    const modMat = new THREE.MeshStandardMaterial({
      roughness: 0.52,
      metalness: 0.04,
      flatShading: true,
    });
    const modMesh = new THREE.InstancedMesh(modGeo, modMat, modCount);
    modMesh.name = 'IslandTerraceModules';
    modMesh.castShadow = true;
    modMesh.receiveShadow = true;
    patioGroup.add(modMesh);

    // ==========================================
    // 3. UNDER-ISLAND ROCK STALACTITES, WATERFALL, BONSAI & CLOUDS
    // ==========================================
    const skyDecorGroup = new THREE.Group();
    skyDecorGroup.name = 'IslandSkyDecor';

    const rockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.rockPrimary),
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });
    const rockSecMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.rockSecondary),
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true,
    });
    const rootMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.trunkPrimary),
      roughness: 0.9,
      flatShading: true,
    });

    // A) Under-Island Inverted Rock Stalactites
    const underGroup = new THREE.Group();
    underGroup.name = 'UnderIslandRocks';

    const layers = 6;
    const maxDepth = 8.5;
    const halfWidth = sceneSize * 0.45;

    for (let l = 0; l < layers; l++) {
      const progress = (l + 1) / layers;
      const layerY = -0.85 - progress * maxDepth;
      const currentRadius = halfWidth * Math.pow(1 - progress * 0.85, 1.3);
      const chunksInLayer = Math.max(3, Math.floor(10 * (1 - progress * 0.6)));

      for (let c = 0; c < chunksInLayer; c++) {
        const angle = (c / chunksInLayer) * Math.PI * 2 + rng.range(-0.3, 0.3);
        const dist = rng.range(0.2, currentRadius);
        const rx = Math.cos(angle) * dist;
        const rz = Math.sin(angle) * dist;

        const sizeX = rng.range(1.8, 3.4) * (1 - progress * 0.38);
        const sizeY = rng.range(1.3, 2.3);
        const sizeZ = rng.range(1.8, 3.4) * (1 - progress * 0.38);

        const chunkMesh = new THREE.Mesh(
          new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
          rng.chance(0.6) ? rockMat : rockSecMat
        );
        chunkMesh.position.set(rx, layerY, rz);
        chunkMesh.rotation.set(
          rng.range(-0.25, 0.25),
          rng.range(0, Math.PI * 2),
          rng.range(-0.25, 0.25)
        );
        chunkMesh.castShadow = true;
        underGroup.add(chunkMesh);
      }
    }

    // Dangling Roots beneath the island
    for (let r = 0; r < 10; r++) {
      const angle = rng.angle();
      const dist = rng.range(halfWidth * 0.3, halfWidth * 0.78);
      const rootLen = rng.range(3.5, 6.8);
      const rootMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.25, rootLen, 5),
        rootMat
      );
      rootMesh.position.set(
        Math.cos(angle) * dist,
        -1.0 - rootLen / 2,
        Math.sin(angle) * dist
      );
      rootMesh.rotation.set(
        rng.range(-0.2, 0.2),
        rng.range(0, Math.PI),
        rng.range(-0.2, 0.2)
      );
      underGroup.add(rootMesh);
    }
    skyDecorGroup.add(underGroup);

    // B) Orbiting Levitating Sub-Rocks & Sky Crystals
    const orbitingRocks: THREE.Mesh[] = [];
    const rockBaseY: number[] = [];
    const crystalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38bdf8'),
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.75,
      roughness: 0.2,
      flatShading: true,
    });

    for (let d = 0; d < 7; d++) {
      const angle = (d / 7) * Math.PI * 2 + rng.range(-0.2, 0.2);
      const dist = rng.range(sceneSize * 0.56, sceneSize * 0.7);
      const dy = rng.range(-2.5, 2.5);
      const dScale = rng.range(0.75, 1.45);

      const isCrystal = d % 2 === 1;
      const dMesh = new THREE.Mesh(
        isCrystal
          ? new THREE.OctahedronGeometry(dScale * 0.75, 0)
          : new THREE.DodecahedronGeometry(dScale, 0),
        isCrystal ? crystalMat : rockSecMat
      );
      dMesh.position.set(Math.cos(angle) * dist, dy, Math.sin(angle) * dist);
      if (isCrystal) dMesh.scale.set(0.7, 1.5, 0.7);
      dMesh.castShadow = true;
      skyDecorGroup.add(dMesh);
      orbitingRocks.push(dMesh);
      rockBaseY.push(dy);
    }

    // C) Hillside Ancient Sky Bonsai Tree & Waterfall Cascade
    const hillTreeGroup = new THREE.Group();
    hillTreeGroup.position.set(-1.6, 2.8, -1.6);

    const trunkMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.65, 3.6, 6),
      rootMat
    );
    trunkMesh.position.y = 1.8;
    trunkMesh.rotation.z = -0.14;
    trunkMesh.castShadow = true;
    hillTreeGroup.add(trunkMesh);

    const canopyMat = new THREE.MeshStandardMaterial({
      color: foliagePrimary,
      roughness: 0.55,
      flatShading: true,
    });
    const canopyAccentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.foliage.accent),
      roughness: 0.45,
      flatShading: true,
    });

    const mainCrown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.35, 1),
      canopyMat
    );
    mainCrown.position.set(0.35, 3.9, 0);
    mainCrown.scale.set(1.2, 0.82, 1.2);
    mainCrown.castShadow = true;
    hillTreeGroup.add(mainCrown);

    const topCrown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.55, 1),
      canopyAccentMat
    );
    topCrown.position.set(-0.5, 4.8, 0.4);
    topCrown.scale.set(1.1, 0.78, 1.1);
    topCrown.castShadow = true;
    hillTreeGroup.add(topCrown);

    skyDecorGroup.add(hillTreeGroup);

    // D) Drifting Fluffy Low-Poly Sky Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.12,
      flatShading: true,
    });

    const clouds: THREE.Group[] = [];
    const cloudBaseY: number[] = [];
    for (let c = 0; c < 4; c++) {
      const cAngle = (c / 4) * Math.PI * 2 + 0.4;
      const cDist = rng.range(sceneSize * 0.48, sceneSize * 0.64);
      const cY = rng.range(4.2, 6.8);
      const cGroup = new THREE.Group();

      const puffs = 4;
      for (let p = 0; p < puffs; p++) {
        const pScale = rng.range(0.85, 1.45);
        const puffMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(pScale, 1),
          cloudMat
        );
        puffMesh.position.set(
          p * 0.85 - puffs * 0.42,
          rng.range(-0.2, 0.2),
          rng.range(-0.25, 0.25)
        );
        cGroup.add(puffMesh);
      }

      cGroup.position.set(
        Math.cos(cAngle) * cDist,
        cY,
        Math.sin(cAngle) * cDist
      );
      skyDecorGroup.add(cGroup);
      clouds.push(cGroup);
      cloudBaseY.push(cY);
    }

    rootGroup.add(skyDecorGroup);

    // ==========================================
    // 4. ZERO-ALLOCATION 60 FPS MORPH & FLOATING ENGINE
    // ==========================================
    const dummyMod = new THREE.Object3D();
    const tempCol = new THREE.Color();
    const tempPaverCol = new THREE.Color();
    let lastProgress = -1;

    const syncScene = (p: number, time: number, forceColor: boolean) => {
      const qrEase = THREE.MathUtils.clamp(p, 0, 1);
      const isProgressChanging =
        forceColor ||
        Math.abs(qrEase - lastProgress) > 0.0005 ||
        (qrEase === 1 && lastProgress !== 1) ||
        (qrEase === 0 && lastProgress !== 0);

      if (isProgressChanging) {
        lastProgress = qrEase;

        const whiteGlowIntensity = Math.pow(qrEase, 1.5) * 8.0;
        terraceBedMat.color.lerpColors(terraceBaseCol, pureWhiteCol, qrEase);
        terraceBedMat.emissiveIntensity = whiteGlowIntensity;
        plinthMat.color.lerpColors(plinthBaseCol, pureWhiteCol, qrEase);
        plinthMat.emissiveIntensity = whiteGlowIntensity;
        paverBlockMat.emissiveIntensity = whiteGlowIntensity;

        // Smoothly retract under-island stalactites, orbiting rocks, tree, and clouds
        const decorScale = Math.max(0.0001, 1 - Math.pow(qrEase, 1.2));
        skyDecorGroup.scale.set(decorScale, decorScale, decorScale);
        skyDecorGroup.visible = qrEase < 0.97;

        modMesh.castShadow = qrEase < 0.35;

        for (let i = 0; i < lightCount; i++) {
          const paver = lightPaverModules[i];
          tempPaverCol.lerpColors(paver.meadowColor, paver.scanColor, qrEase);
          lightPaversMesh.setColorAt(i, tempPaverCol);
        }
        if (lightPaversMesh.instanceColor) {
          lightPaversMesh.instanceColor.needsUpdate = true;
        }

        for (let i = 0; i < modCount; i++) {
          const mod = islandModules[i];
          const localT = THREE.MathUtils.clamp(
            (qrEase - mod.delay) / (1 - 0.24),
            0,
            1
          );
          const localEase = localT * localT * (3 - 2 * localT);

          const y3D = mod.height3D / 2;
          const scaleY3D = mod.height3D / tileBaseHeight;

          const curY = THREE.MathUtils.lerp(y3D, mod.yFlat, localEase);
          const curScaleY = THREE.MathUtils.lerp(
            scaleY3D,
            mod.scaleYFlat,
            localEase
          );
          const curScaleXZ = THREE.MathUtils.lerp(
            mod.scaleXZ3D,
            mod.scaleXZFlat,
            localEase
          );

          dummyMod.position.set(mod.x, curY, mod.z);
          dummyMod.scale.set(curScaleXZ, curScaleY, curScaleXZ);
          dummyMod.updateMatrix();
          modMesh.setMatrixAt(i, dummyMod.matrix);

          tempCol.lerpColors(mod.color3D, mod.colorQR, localEase);
          modMesh.setColorAt(i, tempCol);
        }

        modMesh.instanceMatrix.needsUpdate = true;
        if (modMesh.instanceColor) {
          modMesh.instanceColor.needsUpdate = true;
        }
      }

      // 60 FPS floating sky island levitation in 3D mode (deterministic from baseY, zero drift)
      if (qrEase < 0.95) {
        for (let i = 0; i < orbitingRocks.length; i++) {
          const rock = orbitingRocks[i];
          rock.position.y =
            rockBaseY[i] + Math.sin(time * 1.6 + i * 1.3) * 0.35;
          rock.rotation.y = time * 0.45 + i;
        }
        for (let i = 0; i < clouds.length; i++) {
          const cl = clouds[i];
          cl.position.y =
            cloudBaseY[i] + Math.sin(time * 1.1 + i * 1.7) * 0.35;
        }
      }
    };

    syncScene(0, 0, true);

    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      syncScene(progress, time, false);
    };

    return rootGroup;
  },
};
