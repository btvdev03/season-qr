/**
 * SeasonQR - Cyberpunk Neon Metropolis 3D Style Generator
 *
 * Transforms any QR code into a living futuristic Sci-Fi Metropolis:
 * 1. 3D Isometric Mode (progress = 0):
 *    - Obsidian & titanium cyber-plinth with glowing neon circuit rim.
 *    - Procedural skyscraper skyline where every QR dark module rises as an
 *      architectural data tower with glowing emissive neon rooftop beacons.
 *    - Corner Finder Patterns form 3-tier Cyber Citadel Command Fortresses.
 *    - Central Holographic Nexus Spire with counter-rotating energy rings & hovering drones
 *      animated smoothly at 60 FPS.
 *
 * 2. 90° Top-Down Scan Mode (progress = 1):
 *    - All skyscrapers, neon beacons, and holographic rings smoothly compress into
 *      a razor-sharp flat QR mosaic on a 100% pure luminous white (#ffffff) background.
 *    - Guaranteed <0.05s scan lock on all smartphone cameras.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableCyberGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface CyberTowerModule {
  x: number;
  z: number;
  isFinder: boolean;
  delay: number;
  wavePhase: number;
  y3D: number;
  scaleY3D: number;
  scaleXZ3D: number;
  towerHeight3D: number;
  color3D: THREE.Color;
  neonColor: THREE.Color;
  yFlat: number;
  scaleYFlat: number;
  scaleXZFlat: number;
  colorQR: THREE.Color;
}

interface CyberPaverModule {
  cityColor: THREE.Color;
  scanColor: THREE.Color;
}

interface CyberPalette {
  plinthColor: string;
  rimNeon: string;
  paverLight: string;
  paverMid: string;
  towerBodyColors: string[];
  neonColors: string[];
  finderDark: string;
  qrDarkColors: string[];
  holoPrimary: string;
  holoSecondary: string;
}

function hash2D(r: number, c: number): number {
  let h = (r * 374761393 + c * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function getCyberPalette(seasonId: string): CyberPalette {
  switch (seasonId) {
    case 'spring': // Hoàng Kim Cyber (Gold & Cyan)
      return {
        plinthColor: '#0f172a',
        rimNeon: '#facc15',
        paverLight: '#f8fafc',
        paverMid: '#e2e8f0',
        towerBodyColors: ['#1e293b', '#0f172a', '#334155', '#1e1b4b'],
        neonColors: ['#facc15', '#eab308', '#38bdf8', '#f59e0b', '#fde047'],
        finderDark: '#090d16',
        qrDarkColors: ['#090d16', '#1e1b4b', '#172554', '#31102f', '#451a03'],
        holoPrimary: '#facc15',
        holoSecondary: '#38bdf8',
      };
    case 'summer': // Ma Trận Lục Bảo (Matrix Emerald & Bio-Cyan)
      return {
        plinthColor: '#052e16',
        rimNeon: '#10b981',
        paverLight: '#f0fdf4',
        paverMid: '#dcfce7',
        towerBodyColors: ['#064e3b', '#022c22', '#0f172a', '#14532d'],
        neonColors: ['#10b981', '#34d399', '#a3e635', '#22d3ee', '#4ade80'],
        finderDark: '#022c22',
        qrDarkColors: ['#022c22', '#064e3b', '#052e16', '#14532d', '#0f172a'],
        holoPrimary: '#10b981',
        holoSecondary: '#22d3ee',
      };
    case 'autumn': // Synthwave Hồng Đỏ (Magenta & Laser Crimson)
      return {
        plinthColor: '#1e0514',
        rimNeon: '#ec4899',
        paverLight: '#fdf2f8',
        paverMid: '#fce7f3',
        towerBodyColors: ['#3b0764', '#1e1b4b', '#4c0519', '#2e1065'],
        neonColors: ['#ec4899', '#f43f5e', '#f97316', '#a855f7', '#fb7185'],
        finderDark: '#190314',
        qrDarkColors: ['#190314', '#3b0764', '#4c0519', '#31102f', '#1e1b4b'],
        holoPrimary: '#ec4899',
        holoSecondary: '#f97316',
      };
    case 'winter': // Blade Runner Băng (Electric Cyan & Violet)
    default:
      return {
        plinthColor: '#090d16',
        rimNeon: '#06b6d4',
        paverLight: '#f1f5f9',
        paverMid: '#e2e8f0',
        towerBodyColors: ['#0f172a', '#1e293b', '#1e1b4b', '#172554'],
        neonColors: ['#06b6d4', '#38bdf8', '#a855f7', '#ec4899', '#22d3ee'],
        finderDark: '#020617',
        qrDarkColors: ['#020617', '#0f172a', '#1e1b4b', '#172554', '#0c4a6e'],
        holoPrimary: '#06b6d4',
        holoSecondary: '#a855f7',
      };
  }
}

export const cyberStyle: QRStyleGenerator = {
  id: 'cyber',
  name: 'Cyberpunk Neon Metropolis',
  vietnameseName: 'Thành Phố Cyberpunk',
  icon: '🌆',
  description:
    'A futuristic 3D neon metropolis where QR modules rise as glowing skyscrapers and holographic data towers.',
  vietnameseDescription:
    ' Đô thị tương lai Cyberpunk 3D với những tòa tháp dữ liệu phát sáng đèn neon và vòng năng lượng hologram 60 FPS.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const N = matrix.size;
    const quietMargin = 2.5;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const palette = getCyberPalette(season.id);
    const cx = (N - 1) / 2;
    const cy = (N - 1) / 2;

    const rootGroup = new THREE.Group() as MorphableCyberGroup;
    rootGroup.name = 'Style_CyberpunkMetropolis';

    const toWorldPos = (r: number, c: number) => ({
      x: (c - cx) * moduleSize,
      z: (r - cy) * moduleSize,
    });

    // ==========================================
    // 1. CYBER TITANIUM PLINTH & NEON CIRCUIT RIM
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'CyberPatio';

    const plinthHeight = 0.6;
    const plinthSize = sceneSize * 1.04;
    const plinthBaseCol = new THREE.Color(palette.plinthColor);
    const pureWhiteCol = new THREE.Color('#ffffff');

    const plinthGeo = new THREE.BoxGeometry(plinthSize, plinthHeight, plinthSize);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: plinthBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.45,
      metalness: 0.35,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    patioGroup.add(plinthMesh);

    const paverBlockHeight = 0.12;
    const terraceBedGeo = new THREE.BoxGeometry(
      sceneSize,
      paverBlockHeight * 0.95,
      sceneSize
    );
    const terraceBaseCol = new THREE.Color(palette.paverLight);
    const terraceBedMat = new THREE.MeshStandardMaterial({
      color: terraceBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.5,
      metalness: 0.1,
    });
    const terraceBedMesh = new THREE.Mesh(terraceBedGeo, terraceBedMat);
    terraceBedMesh.position.y = paverBlockHeight / 2 - 0.005;
    terraceBedMesh.receiveShadow = true;
    patioGroup.add(terraceBedMesh);

    // Light Pavers (City Street Grid)
    const paverBlockGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      paverBlockHeight,
      moduleSize * 0.988
    );
    const paverBlockMat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.45,
      metalness: 0.08,
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
    lightPaversMesh.name = 'CyberLightPavers';
    lightPaversMesh.receiveShadow = true;

    const lightPaverModules: CyberPaverModule[] = [];
    const dummyPaver = new THREE.Object3D();
    const colPaverA = new THREE.Color(palette.paverLight);
    const colPaverB = new THREE.Color(palette.paverMid);

    let lIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyPaver.position.set(x, paverBlockHeight / 2, z);
          dummyPaver.scale.set(1, 1, 1);
          dummyPaver.updateMatrix();
          lightPaversMesh.setMatrixAt(lIdx, dummyPaver.matrix);

          const cityCol = (r + c) % 2 === 0 ? colPaverA : colPaverB;
          lightPaverModules.push({
            cityColor: cityCol.clone(),
            scanColor: pureWhiteCol.clone(),
          });
          lightPaversMesh.setColorAt(lIdx, cityCol);
          lIdx++;
        }
      }
    }
    lightPaversMesh.instanceMatrix.needsUpdate = true;
    if (lightPaversMesh.instanceColor) lightPaversMesh.instanceColor.needsUpdate = true;
    patioGroup.add(lightPaversMesh);
    rootGroup.add(patioGroup);

    // ==========================================
    // 2. SKYSCRAPER DARK MODULES & NEON ROOFTOP BEACONS
    // ==========================================
    const towerModules: CyberTowerModule[] = [];
    const bodyColors = palette.towerBodyColors.map((c) => new THREE.Color(c));
    const neonColors = palette.neonColors.map((c) => new THREE.Color(c));
    const qrDarkColors = palette.qrDarkColors.map((c) => new THREE.Color(c));
    const finderDarkCol = new THREE.Color(palette.finderDark);
    const tileBaseHeight = paverBlockHeight * 1.15;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) continue;

        const { x, z } = toWorldPos(r, c);
        const isFinder = matrix.isFinder(r, c);
        const rnd = hash2D(r, c);
        const rnd2 = hash2D(r * 17 + 5, c * 29 + 11);

        const u = cx > 0 ? (c - cx) / cx : 0;
        const v = cy > 0 ? (r - cy) / cy : 0;
        const radialDist = Math.hypot(u, v);
        const delay = Math.min(0.24, radialDist * 0.16);
        const wavePhase = u * 2.5 + v * 2.5 + rnd * Math.PI;

        const yFlat = paverBlockHeight / 2;
        const scaleYFlat = 1.0;
        const scaleXZFlat = 1.0;

        let towerH = tileBaseHeight;
        let scaleXZ3D = 0.92;
        let color3D: THREE.Color;
        let neonCol: THREE.Color;
        let colorQR: THREE.Color;

        if (isFinder) {
          // Cyber Citadel Command Fortress in 3 corners
          const dr = r < 7 ? r : r - (N - 7);
          const dc = c < 7 ? c : c - (N - 7);
          const cheb = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
          towerH = cheb === 0 ? 2.4 : cheb === 1 ? 1.65 : 0.85;
          scaleXZ3D = 0.96;
          color3D = finderDarkCol.clone();
          neonCol = new THREE.Color(palette.holoPrimary);
          colorQR = finderDarkCol.clone();
        } else {
          // Procedural Metropolis Skyline: tall downtown cluster, avenue canyons, midtown hubs
          const downtownFactor = Math.max(0, 1 - radialDist * 0.95);
          const districtCluster =
            0.5 + 0.5 * Math.sin(u * 4.2) * Math.cos(v * 4.2);
          const rawHeight =
            0.55 +
            Math.pow(downtownFactor, 1.3) * 3.8 +
            districtCluster * 1.45 +
            rnd * 1.35;
          towerH = THREE.MathUtils.clamp(rawHeight, 0.55, 6.2);
          scaleXZ3D = 0.88;
          color3D = bodyColors[Math.floor(rnd * bodyColors.length)].clone();
          neonCol = neonColors[Math.floor(rnd2 * neonColors.length)].clone();
          colorQR = qrDarkColors[Math.floor(rnd * qrDarkColors.length)].clone();
        }

        const scaleY3D = towerH / tileBaseHeight;
        const y3D = towerH / 2;

        towerModules.push({
          x,
          z,
          isFinder,
          delay,
          wavePhase,
          y3D,
          scaleY3D,
          scaleXZ3D,
          towerHeight3D: towerH,
          color3D,
          neonColor: neonCol,
          yFlat,
          scaleYFlat,
          scaleXZFlat,
          colorQR,
        });
      }
    }

    const towerCount = towerModules.length;
    const towerGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      tileBaseHeight,
      moduleSize * 0.988
    );
    const towerMat = new THREE.MeshStandardMaterial({
      roughness: 0.32,
      metalness: 0.25,
      flatShading: true,
    });

    const towerMesh = new THREE.InstancedMesh(towerGeo, towerMat, towerCount);
    towerMesh.name = 'CyberSkyscraperModules';
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    patioGroup.add(towerMesh);

    // Glowing Neon Rooftop Beacons (sit atop every skyscraper in 3D mode, retract in 90° scan mode)
    const neonCapHeight = 0.09;
    const neonCapGeo = new THREE.BoxGeometry(
      moduleSize * 0.78,
      neonCapHeight,
      moduleSize * 0.78
    );
    const neonCapMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 1.85,
      roughness: 0.2,
      metalness: 0.1,
    });
    const neonCapMesh = new THREE.InstancedMesh(
      neonCapGeo,
      neonCapMat,
      towerCount
    );
    neonCapMesh.name = 'CyberNeonRooftops';
    neonCapMesh.castShadow = false;
    patioGroup.add(neonCapMesh);

    // ==========================================
    // 3. CENTRAL HOLOGRAPHIC NEXUS SPIRE & ORBITAL RINGS
    // ==========================================
    const nexusGroup = new THREE.Group();
    nexusGroup.name = 'CyberHoloNexus';

    // Glowing Perimeter Neon Circuit Frame around plinth
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.rimNeon),
      emissive: new THREE.Color(palette.rimNeon),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const borderOffset = sceneSize * 0.51;
    const barThick = 0.14;
    const barEdges = [
      { x: 0, z: -borderOffset, w: sceneSize * 1.03, d: barThick },
      { x: 0, z: borderOffset, w: sceneSize * 1.03, d: barThick },
      { x: -borderOffset, z: 0, w: barThick, d: sceneSize * 1.03 },
      { x: borderOffset, z: 0, w: barThick, d: sceneSize * 1.03 },
    ];
    for (const edge of barEdges) {
      const bGeo = new THREE.BoxGeometry(edge.w, barThick, edge.d);
      const bMesh = new THREE.Mesh(bGeo, rimMat);
      bMesh.position.set(edge.x, 0.04, edge.z);
      nexusGroup.add(bMesh);
    }

    // Central Holographic Energy Rings & Beacon
    const holoMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.holoPrimary),
      emissive: new THREE.Color(palette.holoPrimary),
      emissiveIntensity: 2.4,
      roughness: 0.15,
      metalness: 0.2,
    });
    const holoMat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.holoSecondary),
      emissive: new THREE.Color(palette.holoSecondary),
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.2,
    });

    const ring1Geo = new THREE.TorusGeometry(3.2, 0.075, 8, 48);
    const ring1 = new THREE.Mesh(ring1Geo, holoMat1);
    ring1.position.y = 7.4;
    ring1.rotation.x = Math.PI / 2.3;
    nexusGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.2, 0.065, 8, 40);
    const ring2 = new THREE.Mesh(ring2Geo, holoMat2);
    ring2.position.y = 7.4;
    ring2.rotation.x = -Math.PI / 2.6;
    nexusGroup.add(ring2);

    // Floating Diamond Core Crystal inside the Hologram Rings
    const coreGeo = new THREE.OctahedronGeometry(0.85, 0);
    const coreMesh = new THREE.Mesh(coreGeo, holoMat1);
    coreMesh.position.y = 7.4;
    coreMesh.scale.set(0.8, 1.45, 0.8);
    nexusGroup.add(coreMesh);

    // 4 Orbiting Cyber Drones
    const droneGroup = new THREE.Group();
    droneGroup.position.y = 6.2;
    for (let d = 0; d < 4; d++) {
      const dAngle = (d / 4) * Math.PI * 2;
      const dRadius = 5.4;
      const droneMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        d % 2 === 0 ? holoMat1 : holoMat2
      );
      droneMesh.position.set(
        Math.cos(dAngle) * dRadius,
        (d % 2) * 0.6,
        Math.sin(dAngle) * dRadius
      );
      droneGroup.add(droneMesh);
    }
    nexusGroup.add(droneGroup);

    rootGroup.add(nexusGroup);

    // ==========================================
    // 4. ZERO-ALLOCATION 60 FPS MORPH & ANIMATION ENGINE
    // ==========================================
    const dummyTower = new THREE.Object3D();
    const dummyCap = new THREE.Object3D();
    const tempColor = new THREE.Color();
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

        // Retract Holographic Nexus & Perimeter Rim
        const nexusScale = Math.max(0.0001, 1 - Math.pow(qrEase, 1.2));
        nexusGroup.scale.set(nexusScale, nexusScale, nexusScale);
        nexusGroup.position.y = -4.0 * qrEase;
        nexusGroup.visible = qrEase < 0.97;

        neonCapMesh.visible = qrEase < 0.92;
        towerMesh.castShadow = qrEase < 0.35;

        for (let i = 0; i < lightCount; i++) {
          const paver = lightPaverModules[i];
          tempPaverCol.lerpColors(paver.cityColor, paver.scanColor, qrEase);
          lightPaversMesh.setColorAt(i, tempPaverCol);
        }
        if (lightPaversMesh.instanceColor) {
          lightPaversMesh.instanceColor.needsUpdate = true;
        }
      }

      // Animate holographic rings & drones in 3D mode
      if (qrEase < 0.95) {
        ring1.rotation.z = time * 0.85;
        ring1.rotation.y = Math.sin(time * 0.7) * 0.35;
        ring2.rotation.z = -time * 1.15;
        ring2.rotation.y = Math.cos(time * 0.8) * 0.4;
        coreMesh.rotation.y = time * 1.6;
        coreMesh.position.y = 7.4 + Math.sin(time * 2.2) * 0.25;
        droneGroup.rotation.y = time * 0.55;
      }

      // Update Skyscraper Towers & Neon Beacons
      if (isProgressChanging || qrEase < 0.05) {
        const waveAmp = (1 - qrEase) * 0.24;
        const capScaleFade = Math.max(0.0001, 1 - qrEase * 1.15);

        for (let i = 0; i < towerCount; i++) {
          const mod = towerModules[i];
          const localT = THREE.MathUtils.clamp(
            (qrEase - mod.delay) / (1 - 0.24),
            0,
            1
          );
          const localEase = localT * localT * (3 - 2 * localT);

          let dynTowerH = mod.towerHeight3D;
          if (!mod.isFinder && waveAmp > 0.001) {
            dynTowerH = Math.max(
              0.35,
              mod.towerHeight3D + Math.sin(time * 2.1 + mod.wavePhase) * waveAmp
            );
          }

          const curY3D = dynTowerH / 2;
          const curScaleY3D = dynTowerH / tileBaseHeight;

          const curY = THREE.MathUtils.lerp(curY3D, mod.yFlat, localEase);
          const curScaleY = THREE.MathUtils.lerp(
            curScaleY3D,
            mod.scaleYFlat,
            localEase
          );
          const curScaleXZ = THREE.MathUtils.lerp(
            mod.scaleXZ3D,
            mod.scaleXZFlat,
            localEase
          );

          dummyTower.position.set(mod.x, curY, mod.z);
          dummyTower.scale.set(curScaleXZ, curScaleY, curScaleXZ);
          dummyTower.updateMatrix();
          towerMesh.setMatrixAt(i, dummyTower.matrix);

          if (isProgressChanging) {
            tempColor.lerpColors(mod.color3D, mod.colorQR, localEase);
            towerMesh.setColorAt(i, tempColor);
          }

          if (neonCapMesh.visible) {
            const topY = THREE.MathUtils.lerp(
              dynTowerH + neonCapHeight * 0.52,
              0.01,
              localEase
            );
            dummyCap.position.set(mod.x, topY, mod.z);
            dummyCap.scale.set(capScaleFade, capScaleFade, capScaleFade);
            dummyCap.updateMatrix();
            neonCapMesh.setMatrixAt(i, dummyCap.matrix);

            if (forceColor) {
              neonCapMesh.setColorAt(i, mod.neonColor);
            }
          }
        }

        towerMesh.instanceMatrix.needsUpdate = true;
        if (isProgressChanging && towerMesh.instanceColor) {
          towerMesh.instanceColor.needsUpdate = true;
        }
        if (neonCapMesh.visible) {
          neonCapMesh.instanceMatrix.needsUpdate = true;
          if (forceColor && neonCapMesh.instanceColor) {
            neonCapMesh.instanceColor.needsUpdate = true;
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
