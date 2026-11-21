/**
 * SeasonQR - 3D Toy Brick World (Lego Style) Generator
 *
 * Transforms any QR code into a playful 3D Studded Toy Brick Kingdom:
 * 1. 3D Isometric Mode (progress = 0):
 *    - Classic molded ABS plastic baseplate plinth.
 *    - Every QR dark module is an authentic 3D studded toy brick (block body +
 *      cylindrical stud cap on top) stacked at stepped architectural heights.
 *    - Centerpiece: A 3D Brick Castle Watchtower with battlements and a waving flag.
 *    - Corner Finder Patterns form 3-tier Brick Fortress Bastions.
 *
 * 2. 90° Top-Down Scan Mode (progress = 1):
 *    - The central brick castle folds away while all stacked toy bricks press
 *      flush into a high-contrast designer brick QR mosaic on a 100% pure
 *      luminous white (#ffffff) baseplate.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphableBrickGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface BrickModuleData {
  x: number;
  z: number;
  isFinder: boolean;
  delay: number;
  wavePhase: number;
  brickHeight3D: number;
  scaleXZ3D: number;
  color3D: THREE.Color;
  yFlat: number;
  scaleYFlat: number;
  scaleXZFlat: number;
  colorQR: THREE.Color;
}

interface BrickPaverModule {
  plateColor: THREE.Color;
  scanColor: THREE.Color;
}

interface BrickPalette {
  baseplateBorder: string;
  tileLight: string;
  tileMid: string;
  brickColors3D: string[];
  finderDark: string;
  qrDarkColors: string[];
  castlePrimary: string;
  castleAccent: string;
  flagColor: string;
}

function hash2D(r: number, c: number): number {
  let h = (r * 374761393 + c * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function getBrickPalette(seasonId: string): BrickPalette {
  switch (seasonId) {
    case 'spring': // Lễ Hội Hoàng Kim (Festival Gold, Crimson & Royal Blue)
      return {
        baseplateBorder: '#b91c1c',
        tileLight: '#fffdf7',
        tileMid: '#fef3c7',
        brickColors3D: ['#dc2626', '#eab308', '#2563eb', '#16a34a', '#ea580c'],
        finderDark: '#1e1b4b',
        qrDarkColors: ['#450a0a', '#1e1b4b', '#451a03', '#14532d', '#7f1d1d'],
        castlePrimary: '#dc2626',
        castleAccent: '#facc15',
        flagColor: '#eab308',
      };
    case 'summer': // Nhiệt Đới Sắc Màu (Tropical Emerald, Ocean Blue & Sun Yellow)
      return {
        baseplateBorder: '#15803d',
        tileLight: '#f8fafc',
        tileMid: '#dcfce7',
        brickColors3D: ['#16a34a', '#0284c7', '#eab308', '#0d9488', '#dc2626'],
        finderDark: '#052e16',
        qrDarkColors: ['#052e16', '#064e3b', '#0c4a6e', '#14532d', '#1e3a8a'],
        castlePrimary: '#0284c7',
        castleAccent: '#facc15',
        flagColor: '#ef4444',
      };
    case 'autumn': // Cổ Điển Retro (Retro Sunset Orange, Burgundy & Slate)
      return {
        baseplateBorder: '#9a3412',
        tileLight: '#fffbeb',
        tileMid: '#ffedd5',
        brickColors3D: ['#ea580c', '#b91c1c', '#d97706', '#475569', '#7c2d12'],
        finderDark: '#271003',
        qrDarkColors: ['#271003', '#450a0a', '#431407', '#7c2d12', '#1e293b'],
        castlePrimary: '#ea580c',
        castleAccent: '#fde047',
        flagColor: '#dc2626',
      };
    case 'winter': // Không Gian Bắc Cực (Space Navy, Cyber Cyan & Ice White)
    default:
      return {
        baseplateBorder: '#1e3a8a',
        tileLight: '#f8fafc',
        tileMid: '#e0f2fe',
        brickColors3D: ['#1d4ed8', '#0284c7', '#334155', '#4f46e5', '#0f172a'],
        finderDark: '#090d16',
        qrDarkColors: ['#090d16', '#0f172a', '#1e1b4b', '#172554', '#1e3a8a'],
        castlePrimary: '#1d4ed8',
        castleAccent: '#38bdf8',
        flagColor: '#f59e0b',
      };
  }
}

export const brickStyle: QRStyleGenerator = {
  id: 'brick',
  name: '3D Toy Brick World',
  vietnameseName: 'Thế Giới Lego 3D',
  icon: '🧱',
  description:
    'A tactile 3D studded toy brick diorama with stacked colorful ABS blocks and a central brick watchtower.',
  vietnameseDescription:
    'Thế giới gạch lắp ráp Lego 3D sống động với từng viên gạch nổi khối sắc màu và tòa lâu đài trung tâm.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const N = matrix.size;
    const quietMargin = 2.5;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const palette = getBrickPalette(season.id);
    const cx = (N - 1) / 2;
    const cy = (N - 1) / 2;

    const rootGroup = new THREE.Group() as MorphableBrickGroup;
    rootGroup.name = 'Style_ToyBrickWorld';

    const toWorldPos = (r: number, c: number) => ({
      x: (c - cx) * moduleSize,
      z: (r - cy) * moduleSize,
    });

    // ==========================================
    // 1. ABS PLASTIC BASEPLATE PLINTH
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'BrickBaseplate';

    const plinthHeight = 0.55;
    const plinthSize = sceneSize * 1.04;
    const plinthBaseCol = new THREE.Color(palette.baseplateBorder);
    const pureWhiteCol = new THREE.Color('#ffffff');

    const plinthGeo = new THREE.BoxGeometry(plinthSize, plinthHeight, plinthSize);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: plinthBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.28,
      metalness: 0.04,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    patioGroup.add(plinthMesh);

    const paverBlockHeight = 0.12;
    const terraceBaseCol = new THREE.Color(palette.tileLight);
    const terraceBedGeo = new THREE.BoxGeometry(
      sceneSize,
      paverBlockHeight * 0.95,
      sceneSize
    );
    const terraceBedMat = new THREE.MeshStandardMaterial({
      color: terraceBaseCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.25,
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
      roughness: 0.25,
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
    lightPaversMesh.name = 'BrickLightTiles';
    lightPaversMesh.receiveShadow = true;

    const lightPaverModules: BrickPaverModule[] = [];
    const dummyPaver = new THREE.Object3D();
    const colA = new THREE.Color(palette.tileLight);
    const colB = new THREE.Color(palette.tileMid);

    let lIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix.matrix[r][c]) {
          const { x, z } = toWorldPos(r, c);
          dummyPaver.position.set(x, paverBlockHeight / 2, z);
          dummyPaver.scale.set(1, 1, 1);
          dummyPaver.updateMatrix();
          lightPaversMesh.setMatrixAt(lIdx, dummyPaver.matrix);

          const pCol = (r + c) % 3 === 0 ? colB : colA;
          lightPaverModules.push({
            plateColor: pCol.clone(),
            scanColor: pureWhiteCol.clone(),
          });
          lightPaversMesh.setColorAt(lIdx, pCol);
          lIdx++;
        }
      }
    }
    lightPaversMesh.instanceMatrix.needsUpdate = true;
    if (lightPaversMesh.instanceColor) lightPaversMesh.instanceColor.needsUpdate = true;
    patioGroup.add(lightPaversMesh);
    rootGroup.add(patioGroup);

    // ==========================================
    // 2. 3D STUDDED TOY BRICKS (BLOCKS + CYLINDER STUDS)
    // ==========================================
    const brickModules: BrickModuleData[] = [];
    const brickColors3D = palette.brickColors3D.map((c) => new THREE.Color(c));
    const qrColors = palette.qrDarkColors.map((c) => new THREE.Color(c));
    const finderDarkCol = new THREE.Color(palette.finderDark);

    const unitBrickH = 0.55; // Height of 1 standard Lego brick layer

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
        const wavePhase = u * 2.0 + v * 2.0 + rnd * Math.PI;

        const yFlat = paverBlockHeight / 2;
        const scaleYFlat = 1.0;
        const scaleXZFlat = 1.0;

        let brickH = unitBrickH;
        let scaleXZ3D = 0.94;
        let color3D: THREE.Color;
        let colorQR: THREE.Color;

        if (isFinder) {
          const dr = r < 7 ? r : r - (N - 7);
          const dc = c < 7 ? c : c - (N - 7);
          const cheb = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
          const layers = cheb === 0 ? 4 : cheb === 1 ? 3 : 2;
          brickH = layers * unitBrickH;
          scaleXZ3D = 0.96;
          color3D =
            cheb === 0
              ? new THREE.Color(palette.castlePrimary)
              : finderDarkCol.clone();
          colorQR = finderDarkCol.clone();
        } else {
          // Stepped quantized toy brick stack layers (1 to 7 bricks tall!)
          const centerHill = Math.max(0, 1 - radialDist * 0.85);
          const layers = Math.max(
            1,
            Math.min(7, Math.round(1 + centerHill * 4 + rnd * 2.5))
          );
          brickH = layers * unitBrickH;
          scaleXZ3D = 0.93;
          color3D =
            brickColors3D[Math.floor(rnd * brickColors3D.length)].clone();
          colorQR = qrColors[Math.floor(rnd * qrColors.length)].clone();
        }

        brickModules.push({
          x,
          z,
          isFinder,
          delay,
          wavePhase,
          brickHeight3D: brickH,
          scaleXZ3D,
          color3D,
          yFlat,
          scaleYFlat,
          scaleXZFlat,
          colorQR,
        });
      }
    }

    const modCount = brickModules.length;
    const tileBaseHeight = paverBlockHeight * 1.15;
    const blockGeo = new THREE.BoxGeometry(
      moduleSize * 0.988,
      tileBaseHeight,
      moduleSize * 0.988
    );
    const blockMat = new THREE.MeshStandardMaterial({
      roughness: 0.22,
      metalness: 0.04,
      flatShading: true,
    });
    const blockMesh = new THREE.InstancedMesh(blockGeo, blockMat, modCount);
    blockMesh.name = 'ToyBrickBodies';
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    patioGroup.add(blockMesh);

    // Cylindrical Toy Brick Studs on top of every brick
    const studH = 0.14;
    const studR = moduleSize * 0.31;
    const studGeo = new THREE.CylinderGeometry(studR, studR, studH, 12);
    const studMat = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.05,
    });
    const studMesh = new THREE.InstancedMesh(studGeo, studMat, modCount);
    studMesh.name = 'ToyBrickStuds';
    studMesh.castShadow = true;
    studMesh.receiveShadow = true;
    patioGroup.add(studMesh);

    // ==========================================
    // 3. CENTRAL 3D BRICK CASTLE WATCHTOWER & FLAG
    // ==========================================
    const castleGroup = new THREE.Group();
    castleGroup.name = 'BrickCastleDecor';

    const castlePrimaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.castlePrimary),
      roughness: 0.22,
      metalness: 0.05,
    });
    const castleAccentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.castleAccent),
      roughness: 0.22,
      metalness: 0.05,
    });
    const flagMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.flagColor),
      emissive: new THREE.Color(palette.flagColor),
      emissiveIntensity: 0.35,
      roughness: 0.25,
    });

    // Main Keep Tower
    const keepBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 3.6, 2.6),
      castlePrimaryMat
    );
    keepBody.position.y = 3.8;
    keepBody.castShadow = true;
    castleGroup.add(keepBody);

    // Crown Battlement Platform
    const crownPlat = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.55, 3.1),
      castleAccentMat
    );
    crownPlat.position.y = 5.85;
    crownPlat.castShadow = true;
    castleGroup.add(crownPlat);

    // 4 Corner Battlement Merlons with Brick Studs
    const merlonOffsets = [
      [-1.15, -1.15],
      [1.15, -1.15],
      [-1.15, 1.15],
      [1.15, 1.15],
    ];
    for (const [mx, mz] of merlonOffsets) {
      const merlon = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.65, 0.75),
        castlePrimaryMat
      );
      merlon.position.set(mx, 6.45, mz);
      merlon.castShadow = true;
      castleGroup.add(merlon);

      const mStud = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12),
        castleAccentMat
      );
      mStud.position.set(mx, 6.85, mz);
      castleGroup.add(mStud);
    }

    // Spire Roof Cone & Waving Brick Flag
    const roofSpire = new THREE.Mesh(
      new THREE.ConeGeometry(1.35, 2.1, 4),
      castleAccentMat
    );
    roofSpire.position.y = 7.15;
    roofSpire.rotation.y = Math.PI / 4;
    roofSpire.castShadow = true;
    castleGroup.add(roofSpire);

    const poleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3 })
    );
    poleMesh.position.y = 8.6;
    castleGroup.add(poleMesh);

    const flagMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.52, 0.08),
      flagMat
    );
    flagMesh.position.set(0.48, 9.1, 0);
    castleGroup.add(flagMesh);

    rootGroup.add(castleGroup);

    // ==========================================
    // 4. ZERO-ALLOCATION 60 FPS MORPH & BRICK WAVE ENGINE
    // ==========================================
    const dummyBlock = new THREE.Object3D();
    const dummyStud = new THREE.Object3D();
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

        const castleScale = Math.max(0.0001, 1 - Math.pow(qrEase, 1.2));
        castleGroup.scale.set(castleScale, castleScale, castleScale);
        castleGroup.position.y = -5.5 * qrEase;
        castleGroup.visible = qrEase < 0.97;

        blockMesh.castShadow = qrEase < 0.35;
        studMesh.castShadow = qrEase < 0.35;
        studMesh.visible = qrEase < 0.92;

        for (let i = 0; i < lightCount; i++) {
          const paver = lightPaverModules[i];
          tempPaverCol.lerpColors(paver.plateColor, paver.scanColor, qrEase);
          lightPaversMesh.setColorAt(i, tempPaverCol);
        }
        if (lightPaversMesh.instanceColor) {
          lightPaversMesh.instanceColor.needsUpdate = true;
        }
      }

      if (qrEase < 0.95) {
        flagMesh.rotation.y = Math.sin(time * 3.2) * 0.25;
      }

      if (isProgressChanging || qrEase < 0.05) {
        const bounceAmp = (1 - qrEase) * 0.14;
        const studScale = Math.max(0.0001, 1 - qrEase * 1.15);

        for (let i = 0; i < modCount; i++) {
          const mod = brickModules[i];
          const localT = THREE.MathUtils.clamp(
            (qrEase - mod.delay) / (1 - 0.24),
            0,
            1
          );
          const localEase = localT * localT * (3 - 2 * localT);

          let dynH = mod.brickHeight3D;
          if (!mod.isFinder && bounceAmp > 0.001) {
            dynH = Math.max(
              0.35,
              mod.brickHeight3D +
                Math.sin(time * 2.2 + mod.wavePhase) * bounceAmp
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

          dummyBlock.position.set(mod.x, curY, mod.z);
          dummyBlock.scale.set(curScaleXZ, curScaleY, curScaleXZ);
          dummyBlock.updateMatrix();
          blockMesh.setMatrixAt(i, dummyBlock.matrix);

          tempCol.lerpColors(mod.color3D, mod.colorQR, localEase);
          if (isProgressChanging) {
            blockMesh.setColorAt(i, tempCol);
          }

          if (studMesh.visible) {
            const studY = THREE.MathUtils.lerp(
              dynH + studH * 0.5,
              0.01,
              localEase
            );
            dummyStud.position.set(mod.x, studY, mod.z);
            dummyStud.scale.set(studScale, studScale, studScale);
            dummyStud.updateMatrix();
            studMesh.setMatrixAt(i, dummyStud.matrix);

            if (isProgressChanging) {
              studMesh.setColorAt(i, tempCol);
            }
          }
        }

        blockMesh.instanceMatrix.needsUpdate = true;
        if (isProgressChanging && blockMesh.instanceColor) {
          blockMesh.instanceColor.needsUpdate = true;
        }
        if (studMesh.visible) {
          studMesh.instanceMatrix.needsUpdate = true;
          if (isProgressChanging && studMesh.instanceColor) {
            studMesh.instanceColor.needsUpdate = true;
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
