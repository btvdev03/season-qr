/**
 * SeasonQR - Crystal Sanctuary 3D Style Generator
 *
 * Transforms any QR code into a magical Crystalline Gem & Arcane Prism Sanctuary:
 * 1. 3D Isometric Mode (progress = 0):
 *    - Pearlescent starlight marble plinth & sanctuary floor.
 *    - QR dark modules elevate as jewel-toned crystal pillars crowned with faceted
 *      octahedral gem tips that gently levitate in a 60 FPS harmonic wave.
 *    - Central Arcane Crystal Monolith Cluster (7 giant angled crystal spires)
 *      encircled by a rotating celestial astrolabe halo ring.
 *    - Corner Finder Patterns form sculpted Crystal Sanctuary Obelisks.
 *
 * 2. 90° Top-Down Scan Mode (progress = 1):
 *    - All levitating crystals, gem crowns, and central spires smoothly descend
 *      and lock into a razor-sharp jewel-cut flat QR mosaic on a 100% pure
 *      luminous white (#ffffff) background.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableCrystalGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface CrystalModuleData {
  x: number;
  z: number;
  isFinder: boolean;
  delay: number;
  wavePhase: number;
  pillarHeight3D: number;
  scaleXZ3D: number;
  color3D: THREE.Color;
  gemColor: THREE.Color;
  yFlat: number;
  scaleYFlat: number;
  scaleXZFlat: number;
  colorQR: THREE.Color;
}

interface CrystalPaverModule {
  sanctuaryColor: THREE.Color;
  scanColor: THREE.Color;
}

interface CrystalPalette {
  plinthColor: string;
  paverLight: string;
  paverMid: string;
  crystalBodyColors: string[];
  gemTipColors: string[];
  finderDark: string;
  qrDarkColors: string[];
  clusterCore: string;
  clusterAccent: string;
  haloGold: string;
}

function hash2D(r: number, c: number): number {
  let h = (r * 374761393 + c * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function getCrystalPalette(seasonId: string): CrystalPalette {
  switch (seasonId) {
    case 'spring': // Hoàng Ngọc Citrine & Imperial Topaz
      return {
        plinthColor: '#451a03',
        paverLight: '#fffbeb',
        paverMid: '#fef3c7',
        crystalBodyColors: ['#b45309', '#d97706', '#92400e', '#ea580c', '#ca8a04'],
        gemTipColors: ['#fde047', '#facc15', '#fbbf24', '#f59e0b'],
        finderDark: '#271003',
        qrDarkColors: ['#271003', '#451a03', '#713f12', '#78350f', '#592004'],
        clusterCore: '#f59e0b',
        clusterAccent: '#fde047',
        haloGold: '#fbbf24',
      };
    case 'summer': // Ngọc Lục Bảo Emerald & Jade
      return {
        plinthColor: '#064e3b',
        paverLight: '#f0fdf4',
        paverMid: '#dcfce7',
        crystalBodyColors: ['#047857', '#059669', '#0d9488', '#15803d', '#065f46'],
        gemTipColors: ['#34d399', '#4ade80', '#2dd4bf', '#a7f3d0'],
        finderDark: '#022c22',
        qrDarkColors: ['#022c22', '#064e3b', '#065f46', '#14532d', '#115e59'],
        clusterCore: '#10b981',
        clusterAccent: '#2dd4bf',
        haloGold: '#facc15',
      };
    case 'autumn': // Hồng Ngọc Ruby & Fire Garnet
      return {
        plinthColor: '#4c0519',
        paverLight: '#fff1f2',
        paverMid: '#ffe4e6',
        crystalBodyColors: ['#be123c', '#e11d48', '#9f1239', '#c2410c', '#b91c1c'],
        gemTipColors: ['#fb7185', '#f43f5e', '#fb923c', '#fda4af'],
        finderDark: '#2b040c',
        qrDarkColors: ['#2b040c', '#4c0519', '#7f1d1d', '#881337', '#450a0a'],
        clusterCore: '#e11d48',
        clusterAccent: '#fb923c',
        haloGold: '#fbbf24',
      };
    case 'winter': // Lam Ngọc Sapphire & Mystic Amethyst
    default:
      return {
        plinthColor: '#1e1b4b',
        paverLight: '#f5f3ff',
        paverMid: '#ede9fe',
        crystalBodyColors: ['#4338ca', '#6d28d9', '#1d4ed8', '#7e22ce', '#0369a1'],
        gemTipColors: ['#38bdf8', '#a855f7', '#818cf8', '#c084fc'],
        finderDark: '#090724',
        qrDarkColors: ['#090724', '#1e1b4b', '#172554', '#2e1065', '#0f172a'],
        clusterCore: '#6366f1',
        clusterAccent: '#38bdf8',
        haloGold: '#c084fc',
      };
  }
}

export const crystalStyle: QRStyleGenerator = {
  id: 'crystal',
  name: 'Crystal Gem Sanctuary',
  vietnameseName: 'Tinh Thể Pha Lê',
  icon: '💎',
  description:
    'An arcane crystalline sanctuary with levitating faceted gem spires and a central prism monolith cluster.',
  vietnameseDescription:
    'Thánh địa tinh thể pha lê 3D lơ lửng kỳ ảo với cụm đá quý đa diện phát sáng và vòng hào quang thiên văn.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const N = matrix.size;
    const quietMargin = 2.5;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const palette = getCrystalPalette(season.id);
    const cx = (N - 1) / 2;
    const cy = (N - 1) / 2;

    const rootGroup = new THREE.Group() as MorphableCrystalGroup;
    rootGroup.name = 'Style_CrystalSanctuary';

    const toWorldPos = (r: number, c: number) => ({
      x: (c - cx) * moduleSize,
      z: (r - cy) * moduleSize,
    });

    // ==========================================
    // 1. STARLIGHT MARBLE PLINTH & FLOOR
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'CrystalPatio';

    const plinthHeight = 0.55;
    const plinthSize = sceneSize * 1.04;
    const plinthBaseCol = new THREE.Color(palette.plinthColor);
    const pureWhiteCol = new THREE.Color('#ffffff');

    const plinthGeo = new THREE.BoxGeometry(plinthSize, plinthHeight, plinthSize);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: plinthBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    patioGroup.add(plinthMesh);

    const paverBlockHeight = 0.12;
    const terraceBaseCol = new THREE.Color(palette.paverLight);
    const terraceBedGeo = new THREE.BoxGeometry(
      sceneSize,
      paverBlockHeight * 0.95,
      sceneSize
    );
    const terraceBedMat = new THREE.MeshStandardMaterial({
      color: terraceBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0.05,
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
      roughness: 0.38,
      metalness: 0.05,
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
    lightPaversMesh.name = 'CrystalLightPavers';
    lightPaversMesh.receiveShadow = true;

    const lightPaverModules: CrystalPaverModule[] = [];
    const dummyPaver = new THREE.Object3D();
    const colA = new THREE.Color(palette.paverLight);
    const colB = new THREE.Color(palette.paverMid);

    let lIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyPaver.position.set(x, paverBlockHeight / 2, z);
          dummyPaver.scale.set(1, 1, 1);
          dummyPaver.updateMatrix();
          lightPaversMesh.setMatrixAt(lIdx, dummyPaver.matrix);

          const sCol = (r * 3 + c * 5) % 3 === 0 ? colB : colA;
          lightPaverModules.push({
            sanctuaryColor: sCol.clone(),
            scanColor: pureWhiteCol.clone(),
          });
          lightPaversMesh.setColorAt(lIdx, sCol);
          lIdx++;
        }
      }
    }
    lightPaversMesh.instanceMatrix.needsUpdate = true;
    if (lightPaversMesh.instanceColor) lightPaversMesh.instanceColor.needsUpdate = true;
    patioGroup.add(lightPaversMesh);
    rootGroup.add(patioGroup);

    // ==========================================
    // 2. CRYSTAL PILLAR MODULES & FACETED GEM CROWNS
    // ==========================================
    const crystalModules: CrystalModuleData[] = [];
    const bodyColors = palette.crystalBodyColors.map((c) => new THREE.Color(c));
    const gemColors = palette.gemTipColors.map((c) => new THREE.Color(c));
    const qrColors = palette.qrDarkColors.map((c) => new THREE.Color(c));
    const finderDarkCol = new THREE.Color(palette.finderDark);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) continue;

        const { x, z } = toWorldPos(r, c);
        const isFinder = matrix.isFinder(r, c);
        const rnd = hash2D(r, c);
        const rnd2 = hash2D(r * 23 + 7, c * 13 + 19);

        const u = cx > 0 ? (c - cx) / cx : 0;
        const v = cy > 0 ? (r - cy) / cy : 0;
        const radialDist = Math.hypot(u, v);
        const delay = Math.min(0.24, radialDist * 0.16);
        const wavePhase = radialDist * 4.0 - rnd * 1.5;

        const yFlat = paverBlockHeight / 2;
        const scaleYFlat = 1.0;
        const scaleXZFlat = 1.0;

        let pillarH = paverBlockHeight;
        let scaleXZ3D = 0.88;
        let color3D: THREE.Color;
        let gemCol: THREE.Color;
        let colorQR: THREE.Color;

        if (isFinder) {
          const dr = r < 7 ? r : r - (N - 7);
          const dc = c < 7 ? c : c - (N - 7);
          const cheb = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
          pillarH = cheb === 0 ? 2.2 : cheb === 1 ? 1.45 : 0.75;
          scaleXZ3D = 0.96;
          color3D = finderDarkCol.clone();
          gemCol = new THREE.Color(palette.clusterAccent);
          colorQR = finderDarkCol.clone();
        } else {
          // Radial crystal amphitheater formation
          const ringWave = 0.5 + 0.5 * Math.cos(radialDist * Math.PI * 2.2);
          const centerPeak = Math.max(0, 1 - radialDist * 0.85);
          pillarH = THREE.MathUtils.clamp(
            0.55 + centerPeak * 3.1 + ringWave * 1.3 + rnd * 1.1,
            0.55,
            5.4
          );
          scaleXZ3D = 0.85;
          color3D = bodyColors[Math.floor(rnd * bodyColors.length)].clone();
          gemCol = gemColors[Math.floor(rnd2 * gemColors.length)].clone();
          colorQR = qrColors[Math.floor(rnd * qrColors.length)].clone();
        }

        crystalModules.push({
          x,
          z,
          isFinder,
          delay,
          wavePhase,
          pillarHeight3D: pillarH,
          scaleXZ3D,
          color3D,
          gemColor: gemCol,
          yFlat,
          scaleYFlat,
          scaleXZFlat,
          colorQR,
        });
      }
    }

    const modCount = crystalModules.length;
    const tileBaseHeight = paverBlockHeight * 1.15;
    const pillarGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      tileBaseHeight,
      moduleSize * 0.988
    );
    const pillarMat = new THREE.MeshStandardMaterial({
      roughness: 0.22,
      metalness: 0.18,
      flatShading: true,
    });
    const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, modCount);
    pillarMesh.name = 'CrystalPillars';
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    patioGroup.add(pillarMesh);

    // Faceted Octahedral Gem Tips hovering on top of each crystal pillar in 3D mode
    const gemRadius = moduleSize * 0.44;
    const gemGeo = new THREE.OctahedronGeometry(gemRadius, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.25,
      flatShading: true,
    });
    const gemMesh = new THREE.InstancedMesh(gemGeo, gemMat, modCount);
    gemMesh.name = 'CrystalGemCrowns';
    gemMesh.castShadow = true;
    patioGroup.add(gemMesh);

    // ==========================================
    // 3. CENTRAL ARCANE CRYSTAL MONOLITH CLUSTER & ASTROLABE
    // ==========================================
    const clusterGroup = new THREE.Group();
    clusterGroup.name = 'CrystalSanctuaryCluster';
    clusterGroup.position.set(0, 1.2, 0);

    const coreCrystalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.clusterCore),
      emissive: new THREE.Color(palette.clusterCore),
      emissiveIntensity: 0.65,
      roughness: 0.14,
      metalness: 0.25,
      flatShading: true,
    });

    const accentCrystalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.clusterAccent),
      emissive: new THREE.Color(palette.clusterAccent),
      emissiveIntensity: 0.8,
      roughness: 0.14,
      metalness: 0.2,
      flatShading: true,
    });

    // Main Central Spire
    const mainSpireGeo = new THREE.ConeGeometry(1.45, 7.2, 6);
    const mainSpire = new THREE.Mesh(mainSpireGeo, coreCrystalMat);
    mainSpire.position.y = 3.8;
    mainSpire.castShadow = true;
    clusterGroup.add(mainSpire);

    // 6 Angled Radial Crystal Shards
    for (let s = 0; s < 6; s++) {
      const angle = (s / 6) * Math.PI * 2;
      const shardH = s % 2 === 0 ? 4.6 : 3.5;
      const shardR = s % 2 === 0 ? 0.85 : 0.65;
      const shardGeo = new THREE.ConeGeometry(shardR, shardH, 5);
      const shardMesh = new THREE.Mesh(
        shardGeo,
        s % 2 === 0 ? accentCrystalMat : coreCrystalMat
      );
      const dist = 1.45;
      shardMesh.position.set(
        Math.cos(angle) * dist,
        shardH * 0.45,
        Math.sin(angle) * dist
      );
      shardMesh.rotation.z = -Math.cos(angle) * 0.36;
      shardMesh.rotation.x = Math.sin(angle) * 0.36;
      shardMesh.castShadow = true;
      clusterGroup.add(shardMesh);
    }

    // Celestial Astrolabe Halo Ring
    const haloMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.haloGold),
      emissive: new THREE.Color(palette.haloGold),
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.5,
    });
    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.08, 8, 48),
      haloMat
    );
    haloRing.position.y = 4.6;
    haloRing.rotation.x = Math.PI / 2.2;
    clusterGroup.add(haloRing);

    rootGroup.add(clusterGroup);

    // ==========================================
    // 4. ZERO-ALLOCATION 60 FPS MORPH & LEVITATION ENGINE
    // ==========================================
    const dummyPillar = new THREE.Object3D();
    const dummyGem = new THREE.Object3D();
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

        const clusterScale = Math.max(0.0001, 1 - Math.pow(qrEase, 1.2));
        clusterGroup.scale.set(clusterScale, clusterScale, clusterScale);
        clusterGroup.visible = qrEase < 0.97;

        gemMesh.visible = qrEase < 0.92;
        pillarMesh.castShadow = qrEase < 0.35;
        gemMesh.castShadow = qrEase < 0.35;

        for (let i = 0; i < lightCount; i++) {
          const paver = lightPaverModules[i];
          tempPaverCol.lerpColors(paver.sanctuaryColor, paver.scanColor, qrEase);
          lightPaversMesh.setColorAt(i, tempPaverCol);
        }
        if (lightPaversMesh.instanceColor) {
          lightPaversMesh.instanceColor.needsUpdate = true;
        }
      }

      if (qrEase < 0.96) {
        clusterGroup.position.y =
          1.2 - 5.0 * qrEase + Math.sin(time * 1.8) * 0.25 * (1 - qrEase);
        clusterGroup.rotation.y = time * 0.35;
        haloRing.rotation.z = -time * 1.1;
      }

      if (isProgressChanging || qrEase < 0.05) {
        const waveAmp = (1 - qrEase) * 0.22;
        const gemScale = Math.max(0.0001, 1 - qrEase * 1.15);

        for (let i = 0; i < modCount; i++) {
          const mod = crystalModules[i];
          const localT = THREE.MathUtils.clamp(
            (qrEase - mod.delay) / (1 - 0.24),
            0,
            1
          );
          const localEase = localT * localT * (3 - 2 * localT);

          let dynH = mod.pillarHeight3D;
          if (!mod.isFinder && waveAmp > 0.001) {
            dynH = Math.max(
              0.35,
              mod.pillarHeight3D + Math.sin(time * 1.9 + mod.wavePhase) * waveAmp
            );
          }

          const y3D = dynH / 2;
          const scaleY3D = dynH / tileBaseHeight;

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

          dummyPillar.position.set(mod.x, curY, mod.z);
          dummyPillar.scale.set(curScaleXZ, curScaleY, curScaleXZ);
          dummyPillar.updateMatrix();
          pillarMesh.setMatrixAt(i, dummyPillar.matrix);

          if (isProgressChanging) {
            tempCol.lerpColors(mod.color3D, mod.colorQR, localEase);
            pillarMesh.setColorAt(i, tempCol);
          }

          if (gemMesh.visible) {
            const gemY = THREE.MathUtils.lerp(
              dynH + gemRadius * 1.38,
              0.01,
              localEase
            );
            dummyGem.position.set(mod.x, gemY, mod.z);
            dummyGem.rotation.set(0, time * 1.2 + mod.wavePhase, 0);
            dummyGem.scale.set(gemScale * 0.85, gemScale * 1.35, gemScale * 0.85);
            dummyGem.updateMatrix();
            gemMesh.setMatrixAt(i, dummyGem.matrix);

            if (forceColor) {
              gemMesh.setColorAt(i, mod.gemColor);
            }
          }
        }

        pillarMesh.instanceMatrix.needsUpdate = true;
        if (isProgressChanging && pillarMesh.instanceColor) {
          pillarMesh.instanceColor.needsUpdate = true;
        }
        if (gemMesh.visible) {
          gemMesh.instanceMatrix.needsUpdate = true;
          if (forceColor && gemMesh.instanceColor) {
            gemMesh.instanceColor.needsUpdate = true;
          }
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
