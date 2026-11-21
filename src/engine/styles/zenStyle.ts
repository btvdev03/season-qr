/**
 * SeasonQR - Oriental Pagoda & Zen Rock Garden 3D Style Generator
 *
 * Transforms any QR code into a peaceful East Asian / Vietnamese Pagoda & Zen Sanctuary:
 * 1. 3D Isometric Mode (progress = 0):
 *    - Raked white-sand Karesansui zen courtyard plinth.
 *    - Centerpiece: A majestic 5-Tier Oriental Pagoda Tower (Tháp Chùa Cổ Kính)
 *      with curved roofs, vermilion pillars, glowing paper windows, and golden finial.
 *    - Vermilion Torii / Tam Quan gate, glowing Kasuga stone lanterns (Đèn Đá),
 *      sacred San-zon-seki rock trinity (Hòn Non Bộ), and floating lotus lanterns.
 *    - QR dark modules form a 3D stepped temple stone & moss garden relief.
 *
 * 2. 90° Top-Down Scan Mode (progress = 1):
 *    - All pagoda tiers, gates, lanterns, and rock formations smoothly fold away
 *      while the 3D courtyard modules lock into a razor-sharp sumi-ink & lacquer
 *      QR code on a 100% pure luminous white (#ffffff) background.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableZenGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface ZenModuleData {
  x: number;
  z: number;
  isFinder: boolean;
  delay: number;
  wavePhase: number;
  height3D: number;
  scaleXZ3D: number;
  color3D: THREE.Color;
  yFlat: number;
  scaleYFlat: number;
  scaleXZFlat: number;
  colorQR: THREE.Color;
}

interface ZenPaverModule {
  sandColor: THREE.Color;
  scanColor: THREE.Color;
}

function hash2D(r: number, c: number): number {
  let h = (r * 374761393 + c * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const zenStyle: QRStyleGenerator = {
  id: 'zen',
  name: 'Chùa Tháp & Vườn Thiền',
  vietnameseName: 'Chùa Tháp & Vườn Thiền',
  icon: '⛩️',
  description:
    'A serene Oriental Pagoda Tower and Zen rock garden with glowing stone lanterns, Torii gate, and sacred rocks.',
  vietnameseDescription:
    'Kiến trúc Tháp Chùa Á Đông 5 tầng cổ kính kết hợp vườn thiền non bộ, cổng Tam Quan và đèn đá phát sáng.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;
    const N = matrix.size;
    const quietMargin = 2.5;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const cx = (N - 1) / 2;
    const cy = (N - 1) / 2;

    const rootGroup = new THREE.Group() as MorphableZenGroup;
    rootGroup.name = 'Style_ZenPagodaGarden';

    const toWorldPos = (r: number, c: number) => ({
      x: (c - cx) * moduleSize,
      z: (r - cy) * moduleSize,
    });

    // ==========================================
    // 1. KARESANSUI RAKED ZEN SAND COURTYARD PLINTH
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'ZenCourtyardPatio';

    const plinthHeight = 0.58;
    const plinthSize = sceneSize * 1.04;
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
    lightPaversMesh.name = 'ZenSandPavers';
    lightPaversMesh.receiveShadow = true;

    const lightPaverModules: ZenPaverModule[] = [];
    const dummyPaver = new THREE.Object3D();
    const sandLight = new THREE.Color(season.ground.lightModule);
    const sandRipple = sandLight.clone().offsetHSL(0, 0, -0.045);

    let lIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyPaver.position.set(x, paverBlockHeight / 2, z);
          dummyPaver.scale.set(1, 1, 1);
          dummyPaver.updateMatrix();
          lightPaversMesh.setMatrixAt(lIdx, dummyPaver.matrix);

          // Concentric raked Zen sand ripple rings
          const distFromCenter = Math.round(Math.hypot(r - cy, c - cx));
          const sCol = distFromCenter % 2 === 0 ? sandLight : sandRipple;
          lightPaverModules.push({
            sandColor: sCol.clone(),
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
    // 2. STEPPED TEMPLE STONE & GARDEN QR DARK MODULES
    // ==========================================
    const zenModules: ZenModuleData[] = [];
    const rockCol1 = new THREE.Color(season.structure.rockPrimary);
    const rockCol2 = new THREE.Color(season.structure.rockSecondary);
    const foliageCol = new THREE.Color(season.foliage.primary);
    const woodCol = new THREE.Color(season.structure.trunkPrimary);
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
        const wavePhase = radialDist * 3.0 + rnd * Math.PI;

        const yFlat = paverBlockHeight / 2;
        const scaleYFlat = 1.0;
        const scaleXZFlat = 1.0;

        let height3D = paverBlockHeight;
        let scaleXZ3D = 0.94;
        let color3D: THREE.Color;
        let colorQR: THREE.Color;

        if (isFinder) {
          // Corner Temple Seal Altars
          const dr = r < 7 ? r : r - (N - 7);
          const dc = c < 7 ? c : c - (N - 7);
          const cheb = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
          height3D = cheb === 0 ? 1.35 : cheb === 1 ? 0.85 : 0.45;
          scaleXZ3D = 0.96;
          color3D =
            cheb === 0 ? new THREE.Color('#991b1b') : finderDarkCol.clone();
          colorQR = finderDarkCol.clone();
        } else {
          // Stepped Zen garden stone & bonsai moss relief around the central pagoda
          if (radialDist < 0.34) {
            // Central temple foundation platform
            height3D = 0.85 + (0.34 - radialDist) * 2.2;
            color3D = woodCol.clone();
            colorQR = darkModCol.clone();
          } else if (radialDist < 0.72) {
            // Mid courtyard zen stones & trimmed seasonal foliage mounds
            height3D = 0.35 + rnd * 1.1;
            color3D =
              rnd > 0.45
                ? foliageCol.clone()
                : rnd > 0.2
                ? rockCol1.clone()
                : rockCol2.clone();
            colorQR =
              rnd > 0.5
                ? darkModCol.clone()
                : finderDarkCol.clone().lerp(foliageCol, 0.22);
          } else {
            // Outer courtyard stepping stones
            height3D = 0.24 + rnd * 0.48;
            color3D = rnd > 0.5 ? rockCol1.clone() : rockCol2.clone();
            colorQR = darkModCol.clone();
          }
        }

        zenModules.push({
          x,
          z,
          isFinder,
          delay,
          wavePhase,
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

    const modCount = zenModules.length;
    const tileBaseHeight = paverBlockHeight * 1.15;
    const modGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      tileBaseHeight,
      moduleSize * 0.988
    );
    const modMat = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.04,
      flatShading: true,
    });
    const modMesh = new THREE.InstancedMesh(modGeo, modMat, modCount);
    modMesh.name = 'ZenCourtyardModules';
    modMesh.castShadow = true;
    modMesh.receiveShadow = true;
    patioGroup.add(modMesh);

    // ==========================================
    // 3. 5-TIER ORIENTAL PAGODA, TORII GATE, LANTERNS & ROCK GARDEN
    // ==========================================
    const zenPropsGroup = new THREE.Group();
    zenPropsGroup.name = 'DecorGroup';

    const vermilionMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b91c1c'),
      roughness: 0.45,
      metalness: 0.08,
    });
    const roofTileMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e293b'),
      roughness: 0.55,
      metalness: 0.15,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#facc15'),
      emissive: new THREE.Color('#eab308'),
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.6,
    });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#fffae0'),
      emissive: new THREE.Color('#ffb703'),
      emissiveIntensity: 1.1,
      roughness: 0.25,
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: rockCol1,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });
    const rockSecMat = new THREE.MeshStandardMaterial({
      color: rockCol2,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true,
    });

    // A) Central 5-Tier Oriental Pagoda Tower (Tháp Chùa 5 Tầng)
    const pagodaGroup = new THREE.Group();
    pagodaGroup.position.set(0, 1.1, 0);

    // Stone Pedestal Base
    const pedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.75, 4.4),
      rockMat
    );
    pedMesh.position.y = 0.375;
    pedMesh.castShadow = true;
    pagodaGroup.add(pedMesh);

    let tierY = 0.75;
    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const scale = Math.pow(0.81, t);
      const wallW = 2.7 * scale;
      const wallH = 1.05 * Math.pow(0.88, t);
      const roofRadius = 2.55 * scale;
      const roofH = 0.62 * Math.pow(0.9, t);

      // Vermilion timber wall core
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wallW, wallH, wallW),
        vermilionMat
      );
      wallMesh.position.y = tierY + wallH / 2;
      wallMesh.castShadow = true;
      pagodaGroup.add(wallMesh);

      // Warm glowing paper window band
      const winMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wallW * 1.02, wallH * 0.45, wallW * 1.02),
        lanternGlowMat
      );
      winMesh.position.y = tierY + wallH * 0.5;
      pagodaGroup.add(winMesh);

      // Curved 4-sided Pagoda Roof Eaves
      const roofMesh = new THREE.Mesh(
        new THREE.ConeGeometry(roofRadius, roofH, 4),
        roofTileMat
      );
      roofMesh.position.y = tierY + wallH + roofH * 0.42;
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.castShadow = true;
      pagodaGroup.add(roofMesh);

      tierY += wallH + roofH * 0.68;
    }

    // Golden Sorin Spire Finial on top of Pagoda
    const spirePole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.14, 1.8, 8),
      goldMat
    );
    spirePole.position.y = tierY + 0.85;
    pagodaGroup.add(spirePole);

    const spireLotus = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      goldMat
    );
    spireLotus.position.y = tierY + 1.8;
    pagodaGroup.add(spireLotus);

    zenPropsGroup.add(pagodaGroup);

    // B) Traditional Vermilion Torii / Tam Quan Entrance Gate (Front-Right Path)
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(0, 0.12, 6.2);

    const pillarH = 3.2;
    const pillarDist = 2.4;
    const pillarRadius = 0.16;

    const leftPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius, pillarH, 8),
      vermilionMat
    );
    leftPillar.position.set(-pillarDist / 2, pillarH / 2, 0);
    leftPillar.castShadow = true;
    toriiGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius, pillarH, 8),
      vermilionMat
    );
    rightPillar.position.set(pillarDist / 2, pillarH / 2, 0);
    rightPillar.castShadow = true;
    toriiGroup.add(rightPillar);

    const nuki = new THREE.Mesh(
      new THREE.BoxGeometry(pillarDist + 0.7, 0.2, 0.22),
      vermilionMat
    );
    nuki.position.set(0, pillarH * 0.78, 0);
    nuki.castShadow = true;
    toriiGroup.add(nuki);

    const kasagi = new THREE.Mesh(
      new THREE.BoxGeometry(pillarDist + 1.6, 0.3, 0.38),
      roofTileMat
    );
    kasagi.position.set(0, pillarH + 0.14, 0);
    kasagi.castShadow = true;
    toriiGroup.add(kasagi);

    zenPropsGroup.add(toriiGroup);

    // C) Pair of Glowing Kasuga Stone Lanterns (Đèn Đá)
    const spawnStoneLantern = (lx: number, lz: number) => {
      const lGroup = new THREE.Group();
      lGroup.position.set(lx, 0.12, lz);

      const lBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.75, 0.35, 6),
        rockMat
      );
      lBase.position.y = 0.18;
      lGroup.add(lBase);

      const lPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.36, 1.05, 6),
        rockMat
      );
      lPost.position.y = 0.85;
      lPost.castShadow = true;
      lGroup.add(lPost);

      const lBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.65, 0.65),
        lanternGlowMat
      );
      lBox.position.y = 1.75;
      lGroup.add(lBox);

      const lRoof = new THREE.Mesh(
        new THREE.ConeGeometry(1.08, 0.55, 6),
        rockSecMat
      );
      lRoof.position.y = 2.3;
      lRoof.castShadow = true;
      lGroup.add(lRoof);

      zenPropsGroup.add(lGroup);
    };

    spawnStoneLantern(-5.2, 4.8);
    spawnStoneLantern(5.2, -4.8);

    // D) Sacred Rock Trinity (Hòn Non Bộ) & Mini Pine Bonsai
    const rockGroup = new THREE.Group();
    rockGroup.position.set(-5.4, 0.12, -3.5);

    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), rockMat);
    r1.scale.set(0.9, 2.1, 1.0);
    r1.position.set(0, 1.15, 0);
    r1.castShadow = true;
    rockGroup.add(r1);

    const r2 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.75, 0),
      rockSecMat
    );
    r2.scale.set(1.0, 1.35, 0.9);
    r2.position.set(1.05, 0.65, 0.45);
    r2.castShadow = true;
    rockGroup.add(r2);

    zenPropsGroup.add(rockGroup);

    // E) Floating Glowing Lotus Lanterns (Hoa Đăng)
    const lotusLanterns: THREE.Mesh[] = [];
    const lotusBaseY: number[] = [];
    const lotusCoords = [
      [4.8, 4.5],
      [-4.6, 0.8],
      [4.5, -1.2],
      [0.0, -5.8],
    ];
    for (let i = 0; i < lotusCoords.length; i++) {
      const [fx, fz] = lotusCoords[i];
      const lotusMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.34, 0),
        goldMat
      );
      const baseY = 1.8 + rng.range(0, 0.8);
      lotusMesh.position.set(fx, baseY, fz);
      zenPropsGroup.add(lotusMesh);
      lotusLanterns.push(lotusMesh);
      lotusBaseY.push(baseY);
    }

    rootGroup.add(zenPropsGroup);

    // ==========================================
    // 4. ZERO-ALLOCATION 60 FPS MORPH & LOTUS ANIMATION ENGINE
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

        const decorScale = Math.max(0.0001, 1 - Math.pow(qrEase, 1.25));
        zenPropsGroup.scale.set(decorScale, decorScale, decorScale);
        zenPropsGroup.position.y = -5.5 * qrEase;
        zenPropsGroup.visible = qrEase < 0.97;

        modMesh.castShadow = qrEase < 0.35;

        for (let i = 0; i < lightCount; i++) {
          const paver = lightPaverModules[i];
          tempPaverCol.lerpColors(paver.sandColor, paver.scanColor, qrEase);
          lightPaversMesh.setColorAt(i, tempPaverCol);
        }
        if (lightPaversMesh.instanceColor) {
          lightPaversMesh.instanceColor.needsUpdate = true;
        }
      }

      if (isProgressChanging || qrEase < 0.05) {
        const waveAmp = (1 - qrEase) * 0.06;

        for (let i = 0; i < modCount; i++) {
          const mod = zenModules[i];
          const localT = THREE.MathUtils.clamp(
            (qrEase - mod.delay) / (1 - 0.24),
            0,
            1
          );
          const localEase = localT * localT * (3 - 2 * localT);

          let dynH = mod.height3D;
          if (!mod.isFinder && waveAmp > 0.001) {
            dynH = Math.max(
              0.2,
              mod.height3D + Math.sin(time * 1.6 + mod.wavePhase) * waveAmp
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

          dummyMod.position.set(mod.x, curY, mod.z);
          dummyMod.scale.set(curScaleXZ, curScaleY, curScaleXZ);
          dummyMod.updateMatrix();
          modMesh.setMatrixAt(i, dummyMod.matrix);

          if (isProgressChanging) {
            tempCol.lerpColors(mod.color3D, mod.colorQR, localEase);
            modMesh.setColorAt(i, tempCol);
          }
        }

        modMesh.instanceMatrix.needsUpdate = true;
        if (isProgressChanging && modMesh.instanceColor) {
          modMesh.instanceColor.needsUpdate = true;
        }
      }

      // Gentle 60 FPS floating lotus lanterns & pagoda finial shimmer in 3D mode
      if (qrEase < 0.95) {
        for (let i = 0; i < lotusLanterns.length; i++) {
          const l = lotusLanterns[i];
          l.position.y = lotusBaseY[i] + Math.sin(time * 1.8 + i * 1.5) * 0.32;
          l.rotation.y = time * 0.9 + i;
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
