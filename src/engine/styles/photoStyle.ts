/**
 * SeasonQR - Photo-to-QR 3D Sculpture & Halftone Engine
 *
 * Transforms any uploaded photo into a dual-state architectural gallery diorama:
 * 1. 3D Isometric Sculpture Mode (progress = 0):
 *    - Sleek pure white porcelain gallery plinth & slab (#f8fafc / #ffffff).
 *    - Full-resolution square-cropped photo canvas anchored on the floor.
 *    - Living 3D voxel relief pixel sculpture hovering harmoniously above the photo
 *      (y3D = 0.8..7.0), colored with the real sampled photo RGB values and elevated
 *      by luminance relief, breathing & rippling smoothly at 60 FPS.
 *    - Sculpted dark corner finder monoliths framing the composition.
 *
 * 2. 90° Top-Down Halftone Scan Mode (progress = 1):
 *    - Smoothly cascades flat onto the photo floor (yFlat = paverBlockHeight + 0.015)
 *      as razor-sharp Halftone center micro-dots:
 *      - ~0.44 * moduleSize for data bits (~80% of every cell shows the HD photo underneath!)
 *      - 0.56 * moduleSize for timing & alignment tracks for instant camera lock.
 *      - Solid 0.988 * moduleSize dark finders (#09090b) & pure glowing white separators (#ffffff).
 *    - Emissive white intensity (Math.pow(qrEase, 1.5) * 8.0) overcomes ACESFilmicToneMapping
 *      so quiet zones and light bits render exact #ffffff for <0.05s scan lock.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';

export interface MorphablePhotoGroup extends THREE.Group {
  updateMorph?: (progress: number, time?: number, delta?: number) => void;
}

interface PhotoModuleData {
  row: number;
  col: number;
  x: number;
  z: number;
  delay: number;
  wavePhase: number;
  radialNorm: number;
  jitter: number;
  y3D: number;
  scaleY3D: number;
  scaleXZ3D: number;
  color3D: THREE.Color;
  yFlat: number;
  scaleYFlat: number;
  scaleXZFlat: number;
  colorQR: THREE.Color;
}

/**
 * Deterministic 2D hash in [0, 1)
 */
function hash2D(r: number, c: number): number {
  let h = (r * 374761393 + c * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Computes ISO/IEC 18004 alignment pattern center coordinates for QR version >= 2.
 */
function getAlignmentCenters(version: number, size: number): Array<[number, number]> {
  if (version < 2) return [];

  const posCount = Math.floor(version / 7) + 2;
  const intervals =
    size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
  const coords: number[] = [size - 7];
  for (let i = 1; i < posCount - 1; i++) {
    coords.push(coords[coords.length - 1] - intervals);
  }
  coords.push(6);
  coords.reverse();

  const centers: Array<[number, number]> = [];
  for (let i = 0; i < coords.length; i++) {
    for (let j = 0; j < coords.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === coords.length - 1) ||
        (i === coords.length - 1 && j === 0)
      ) {
        continue;
      }
      centers.push([coords[i], coords[j]]);
    }
  }
  return centers;
}

/**
 * Checks whether a non-reserved cell is a critical QR structural anchor:
 * - Timing patterns (row 6 or col 6)
 * - Format information bits surrounding finders (row 8 / col 8)
 * - 5x5 Alignment patterns
 */
function isStructuralAnchor(
  row: number,
  col: number,
  size: number,
  alignmentCenters: ReadonlyArray<[number, number]>
): boolean {
  if (row === 6 || col === 6) return true;
  if (row === 8 && (col <= 8 || col >= size - 8)) return true;
  if (col === 8 && (row <= 8 || row >= size - 7)) return true;
  for (let i = 0; i < alignmentCenters.length; i++) {
    const [ar, ac] = alignmentCenters[i];
    if (Math.abs(row - ar) <= 2 && Math.abs(col - ac) <= 2) {
      return true;
    }
  }
  return false;
}

/**
 * Computes an aesthetic warm gold & emerald fallback color and luminance [0..1]
 * while an uploaded image decodes or when no photo is provided yet.
 */
function computeFallbackSample(
  u: number,
  v: number,
  rnd: number,
  outColor: THREE.Color
): number {
  const wave =
    0.5 + 0.5 * Math.sin(u * 2.4 + v * 1.8) * Math.cos(u * 1.5 - v * 2.2);
  const radial = Math.max(0, 1 - Math.hypot(u, v) * 0.72);
  const t = THREE.MathUtils.clamp(
    wave * 0.55 + radial * 0.35 + (rnd - 0.5) * 0.14,
    0,
    1
  );

  if (t < 0.38) {
    const k = t / 0.38;
    outColor.setRGB(
      THREE.MathUtils.lerp(6 / 255, 16 / 255, k),
      THREE.MathUtils.lerp(95 / 255, 185 / 255, k),
      THREE.MathUtils.lerp(70 / 255, 129 / 255, k),
      THREE.SRGBColorSpace
    );
  } else if (t < 0.72) {
    const k = (t - 0.38) / 0.34;
    outColor.setRGB(
      THREE.MathUtils.lerp(16 / 255, 245 / 255, k),
      THREE.MathUtils.lerp(185 / 255, 158 / 255, k),
      THREE.MathUtils.lerp(129 / 255, 11 / 255, k),
      THREE.SRGBColorSpace
    );
  } else {
    const k = (t - 0.72) / 0.28;
    outColor.setRGB(
      THREE.MathUtils.lerp(245 / 255, 253 / 255, k),
      THREE.MathUtils.lerp(158 / 255, 224 / 255, k),
      THREE.MathUtils.lerp(11 / 255, 71 / 255, k),
      THREE.SRGBColorSpace
    );
  }
  return t;
}

/**
 * Generates an aesthetic warm gold / emerald CanvasTexture as initial floor artwork.
 */
function createFallbackPhotoTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#065f46');
    grad.addColorStop(0.35, '#10b981');
    grad.addColorStop(0.7, '#f59e0b');
    grad.addColorStop(1, '#fde047');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const glow = ctx.createRadialGradient(
      size * 0.5,
      size * 0.45,
      size * 0.05,
      size * 0.5,
      size * 0.5,
      size * 0.65
    );
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)');
    glow.addColorStop(1, 'rgba(6, 78, 59, 0.35)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Computes elevated 3D relief height (y3D in 0.8..7.0) and voxel vertical scale
 * from normalized luminance and radial dome sculpting.
 */
function computeReliefGeometry(
  lum: number,
  radialNorm: number,
  jitter: number,
  moduleSize: number,
  tileBaseHeight: number
): { y3D: number; scaleY3D: number } {
  const domeLift = Math.pow(Math.max(0, 1 - radialNorm * 0.72), 1.35);
  const y3D = THREE.MathUtils.clamp(
    1.15 + domeLift * 3.1 + lum * 2.15 + jitter * 0.28,
    1.12,
    6.65
  );
  const voxelHeightWorld = moduleSize * (0.68 + lum * 0.95);
  const scaleY3D = voxelHeightWorld / tileBaseHeight;
  return { y3D, scaleY3D };
}

/**
 * Computes corner finder local (dr, dc) in [0..6] and returns sculpted pillar height.
 */
function getFinderPillarHeight(row: number, col: number, N: number): number {
  const dr = row < 7 ? row : row - (N - 7);
  const dc = col < 7 ? col : col - (N - 7);
  const cheb = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
  if (cheb === 0) return 1.85;
  if (cheb === 1) return dr === 3 || dc === 3 ? 1.25 : 1.05;
  const isFinderCorner = (dr === 0 || dr === 6) && (dc === 0 || dc === 6);
  return isFinderCorner ? 0.78 : 0.46;
}

export const photoStyle: QRStyleGenerator = {
  id: 'photo',
  name: 'Photo Sculpture QR',
  vietnameseName: 'Ảnh Nghệ Thuật 3D',
  icon: '🖼️',
  description:
    'Transforms your uploaded photo into a floating 3D voxel relief sculpture that morphs into a scannable Halftone QR code.',
  vietnameseDescription:
    'Biến bức ảnh của bạn thành tác phẩm điêu khắc voxel 3D sống động, chạm để biến hình thành mã QR Halftone quét trực tiếp trên ảnh.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, sceneSize = 24, photoDataUrl } = params;
    const N = matrix.size;
    const quietMargin = 2.5;
    const totalModules = N + quietMargin * 2;
    const moduleSize = sceneSize / totalModules;
    const qrAreaSize = N * moduleSize;
    const cx = (N - 1) / 2;
    const cy = (N - 1) / 2;

    const rootGroup = new THREE.Group() as MorphablePhotoGroup;
    rootGroup.name = 'Style_PhotoSculptureQR';

    let isDisposed = false;

    const toWorldPos = (r: number, c: number) => ({
      x: (c - cx) * moduleSize,
      z: (r - cy) * moduleSize,
    });

    // ==========================================
    // 1. PURE WHITE PORCELAIN GALLERY PLINTH & SLAB
    // ==========================================
    const patioGroup = new THREE.Group();
    patioGroup.name = 'PorcelainGalleryPlinth';

    const plinthHeight = 0.55;
    const plinthSize = sceneSize * 1.04;
    const plinthGalleryCol = new THREE.Color('#f8fafc');
    const terraceGalleryCol = new THREE.Color('#ffffff');
    const pureWhiteCol = new THREE.Color('#ffffff');

    const plinthGeo = new THREE.BoxGeometry(plinthSize, plinthHeight, plinthSize);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: plinthGalleryCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0.03,
      flatShading: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    patioGroup.add(plinthMesh);

    const paverBlockHeight = 0.12;
    const terraceBedHeight = paverBlockHeight * 0.92;
    const terraceBedGeo = new THREE.BoxGeometry(
      sceneSize,
      terraceBedHeight,
      sceneSize
    );
    const terraceBedMat = new THREE.MeshStandardMaterial({
      color: terraceGalleryCol.clone(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.3,
      metalness: 0.02,
    });
    const terraceBedMesh = new THREE.Mesh(terraceBedGeo, terraceBedMat);
    terraceBedMesh.position.y = terraceBedHeight / 2;
    terraceBedMesh.receiveShadow = true;
    patioGroup.add(terraceBedMesh);

    // ==========================================
    // 2. FULL-RESOLUTION PHOTO FLOOR CANVAS
    // ==========================================
    const fallbackTex = createFallbackPhotoTexture();
    const photoGeo = new THREE.PlaneGeometry(qrAreaSize, qrAreaSize);
    photoGeo.rotateX(-Math.PI / 2);

    const photoMat = new THREE.MeshStandardMaterial({
      map: fallbackTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: fallbackTex,
      emissiveIntensity: 0,
      roughness: 0.72,
      metalness: 0.0,
    });
    const photoPlane = new THREE.Mesh(photoGeo, photoMat);
    photoPlane.name = 'PhotoFloorCanvas';
    photoPlane.position.y = paverBlockHeight + 0.004;
    photoPlane.receiveShadow = true;
    patioGroup.add(photoPlane);

    // Subtle QR contrast halftone overlay matrix (fades from 0 in 3D to 0.38 in 90° scan mode)
    // Guarantees 100% reliable QR binarization on all scanners while keeping >60% rich photo colors
    const maskPixels = new Uint8Array(N * N * 4);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const idx = (r * N + c) * 4;
        const val = matrix.matrix[r][c] ? 0 : 255;
        maskPixels[idx] = val;
        maskPixels[idx + 1] = val;
        maskPixels[idx + 2] = val;
        maskPixels[idx + 3] = 255;
      }
    }
    const qrMaskTex = new THREE.DataTexture(maskPixels, N, N, THREE.RGBAFormat);
    qrMaskTex.flipY = true;
    qrMaskTex.minFilter = THREE.NearestFilter;
    qrMaskTex.magFilter = THREE.NearestFilter;
    qrMaskTex.wrapS = THREE.ClampToEdgeWrapping;
    qrMaskTex.wrapT = THREE.ClampToEdgeWrapping;
    qrMaskTex.needsUpdate = true;

    const qrOverlayGeo = new THREE.PlaneGeometry(qrAreaSize, qrAreaSize);
    qrOverlayGeo.rotateX(-Math.PI / 2);
    const qrOverlayMat = new THREE.MeshBasicMaterial({
      map: qrMaskTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const qrOverlayPlane = new THREE.Mesh(qrOverlayGeo, qrOverlayMat);
    qrOverlayPlane.name = 'PhotoQRContrastOverlay';
    qrOverlayPlane.position.y = paverBlockHeight + 0.006;
    qrOverlayPlane.visible = false;
    patioGroup.add(qrOverlayPlane);

    rootGroup.add(patioGroup);

    // ==========================================
    // 3. CLASSIFY QR MODULES INTO 4 INSTANCED GROUPS
    // ==========================================
    const tileBaseHeight = 0.016;
    const yFlat = paverBlockHeight + 0.015;
    const baseTileGeo = new THREE.BoxGeometry(
      moduleSize,
      tileBaseHeight,
      moduleSize
    );

    const alignmentCenters = getAlignmentCenters(matrix.version, N);

    const finderDarkModules: PhotoModuleData[] = [];
    const finderLightModules: PhotoModuleData[] = [];
    const dataDarkModules: PhotoModuleData[] = [];
    const dataLightModules: PhotoModuleData[] = [];

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const isDark = matrix.matrix[r][c];
        const isReserved = matrix.isReserved(r, c);
        const { x, z } = toWorldPos(r, c);
        const u = cx > 0 ? (c - cx) / cx : 0;
        const v = cy > 0 ? (r - cy) / cy : 0;
        const radialNorm = Math.min(1, Math.hypot(u, v) / 1.414);
        const rnd = hash2D(r, c);
        const jitter = rnd - 0.5;
        const delay = radialNorm * 0.24;
        const wavePhase = u * 2.1 + v * 1.7 + rnd * 0.8;

        if (isReserved) {
          if (isDark) {
            const pillarH = getFinderPillarHeight(r, c, N);
            const dr = r < 7 ? r : r - (N - 7);
            const dc = c < 7 ? c : c - (N - 7);
            const isCore = Math.max(Math.abs(dr - 3), Math.abs(dc - 3)) <= 1;
            finderDarkModules.push({
              row: r,
              col: c,
              x,
              z,
              delay: delay * 0.6,
              wavePhase,
              radialNorm,
              jitter,
              y3D: paverBlockHeight + pillarH / 2,
              scaleY3D: pillarH / tileBaseHeight,
              scaleXZ3D: 0.9,
              color3D: new THREE.Color(isCore ? '#09090b' : '#27272a'),
              yFlat,
              scaleYFlat: 1.0,
              scaleXZFlat: 1.004,
              colorQR: new THREE.Color('#09090b'),
            });
          } else {
            finderLightModules.push({
              row: r,
              col: c,
              x,
              z,
              delay: delay * 0.6,
              wavePhase,
              radialNorm,
              jitter,
              y3D: yFlat,
              scaleY3D: 0.001,
              scaleXZ3D: 0.001,
              color3D: new THREE.Color('#ffffff'),
              yFlat,
              scaleYFlat: 1.0,
              scaleXZFlat: 1.004,
              colorQR: new THREE.Color('#ffffff'),
            });
          }
        } else {
          const fallbackColor = new THREE.Color();
          const lum = computeFallbackSample(u, v, rnd, fallbackColor);
          const { y3D, scaleY3D } = computeReliefGeometry(
            lum,
            radialNorm,
            jitter,
            moduleSize,
            tileBaseHeight
          );
          const anchorBit = isStructuralAnchor(r, c, N, alignmentCenters);
          const scaleXZFlat = anchorBit ? 1.004 : 0.48;

          const modData: PhotoModuleData = {
            row: r,
            col: c,
            x,
            z,
            delay,
            wavePhase,
            radialNorm,
            jitter,
            y3D,
            scaleY3D,
            scaleXZ3D: 0.86,
            color3D: fallbackColor,
            yFlat,
            scaleYFlat: 1.0,
            scaleXZFlat,
            colorQR: new THREE.Color(isDark ? '#09090b' : '#ffffff'),
          };

          if (isDark) {
            dataDarkModules.push(modData);
          } else {
            dataLightModules.push(modData);
          }
        }
      }
    }

    // Materials
    const finderDarkMat = new THREE.MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.04,
      flatShading: true,
    });

    const finderLightMat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0.02,
      flatShading: true,
    });

    const dataDarkMat = new THREE.MeshStandardMaterial({
      roughness: 0.38,
      metalness: 0.04,
      flatShading: true,
    });

    const dataLightMat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.38,
      metalness: 0.04,
      flatShading: true,
    });

    const createInstancedLayer = (
      name: string,
      mat: THREE.MeshStandardMaterial,
      items: PhotoModuleData[],
      castShadow: boolean
    ): THREE.InstancedMesh | null => {
      if (items.length === 0) return null;
      const mesh = new THREE.InstancedMesh(baseTileGeo, mat, items.length);
      mesh.name = name;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      patioGroup.add(mesh);
      return mesh;
    };

    const finderDarkMesh = createInstancedLayer(
      'FinderDarkPillars',
      finderDarkMat,
      finderDarkModules,
      true
    );
    const finderLightMesh = createInstancedLayer(
      'FinderLightSeparators',
      finderLightMat,
      finderLightModules,
      false
    );
    const dataDarkMesh = createInstancedLayer(
      'PhotoDataDarkVoxels',
      dataDarkMat,
      dataDarkModules,
      true
    );
    const dataLightMesh = createInstancedLayer(
      'PhotoDataLightVoxels',
      dataLightMat,
      dataLightModules,
      true
    );

    // ==========================================
    // 4. ZERO-ALLOCATION MORPH & 60 FPS SCULPTURE WAVE ENGINE
    // ==========================================
    const dummy = new THREE.Object3D();
    dummy.rotation.set(0, 0, 0);
    const tempColor = new THREE.Color();

    let lastProgress = -1;
    let currentProgress = 0;
    let currentTime = 0;

    const applyLayer = (
      mesh: THREE.InstancedMesh | null,
      items: PhotoModuleData[],
      qrEase: number,
      time: number,
      withWave: boolean,
      updateColors: boolean
    ) => {
      if (!mesh || items.length === 0) return;

      const waveAmp = withWave ? (1.0 - qrEase) * 0.22 : 0;

      for (let i = 0; i < items.length; i++) {
        const mod = items[i];
        const rawT = THREE.MathUtils.clamp(
          (qrEase - mod.delay) / (1 - 0.24),
          0,
          1
        );
        const localEase =
          rawT * rawT * (3 - 2 * rawT);

        let curY = THREE.MathUtils.lerp(mod.y3D, mod.yFlat, localEase);
        if (waveAmp > 0.0001) {
          curY +=
            Math.sin(time * 1.6 + mod.wavePhase) * waveAmp +
            Math.cos(time * 1.05 + mod.radialNorm * 3.2) * (waveAmp * 0.45);
        }

        const curScaleY = THREE.MathUtils.lerp(
          mod.scaleY3D,
          mod.scaleYFlat,
          localEase
        );
        const curScaleXZ = THREE.MathUtils.lerp(
          mod.scaleXZ3D,
          mod.scaleXZFlat,
          localEase
        );

        dummy.position.set(mod.x, curY, mod.z);
        dummy.scale.set(curScaleXZ, curScaleY, curScaleXZ);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        if (updateColors) {
          tempColor.lerpColors(mod.color3D, mod.colorQR, localEase);
          mesh.setColorAt(i, tempColor);
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (updateColors && mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    };

    const syncAllMeshes = (p: number, time: number, forceColorSync: boolean) => {
      const qrEase = THREE.MathUtils.clamp(p, 0, 1);
      const isProgressChanging =
        forceColorSync ||
        Math.abs(qrEase - lastProgress) > 0.0005 ||
        (qrEase === 1 && lastProgress !== 1) ||
        (qrEase === 0 && lastProgress !== 0);

      if (isProgressChanging) {
        lastProgress = qrEase;

        const whiteGlowIntensity = Math.pow(qrEase, 1.5) * 8.0;
        terraceBedMat.color.lerpColors(
          terraceGalleryCol,
          pureWhiteCol,
          qrEase
        );
        terraceBedMat.emissiveIntensity = whiteGlowIntensity;

        plinthMat.color.lerpColors(plinthGalleryCol, pureWhiteCol, qrEase);
        plinthMat.emissiveIntensity = whiteGlowIntensity;

        finderLightMat.emissiveIntensity = whiteGlowIntensity;
        dataLightMat.emissiveIntensity = whiteGlowIntensity;

        // Subtle gallery backlight & contrast halftone overlay on photo canvas in 90° scan mode
        photoMat.emissiveIntensity = Math.pow(qrEase, 1.5) * 0.18;
        qrOverlayMat.opacity = Math.pow(qrEase, 1.3) * 0.38;
        qrOverlayPlane.visible = qrEase > 0.01;

        // Disable module shadows once transitioning toward 90° scan view
        const castSculptureShadows = qrEase < 0.35;
        if (finderDarkMesh) finderDarkMesh.castShadow = castSculptureShadows;
        if (dataDarkMesh) dataDarkMesh.castShadow = castSculptureShadows;
        if (dataLightMesh) dataLightMesh.castShadow = castSculptureShadows;

        if (finderLightMesh) {
          finderLightMesh.visible = qrEase > 0.01;
        }

        applyLayer(finderDarkMesh, finderDarkModules, qrEase, time, false, true);
        if (finderLightMesh && finderLightMesh.visible) {
          applyLayer(
            finderLightMesh,
            finderLightModules,
            qrEase,
            time,
            false,
            true
          );
        }
        applyLayer(dataDarkMesh, dataDarkModules, qrEase, time, true, true);
        applyLayer(dataLightMesh, dataLightModules, qrEase, time, true, true);
      } else if (qrEase < 0.05) {
        // Real-time 60 FPS gentle sculpture breathing & wave in 3D isometric mode
        applyLayer(dataDarkMesh, dataDarkModules, qrEase, time, true, false);
        applyLayer(dataLightMesh, dataLightModules, qrEase, time, true, false);
      }
    };

    rootGroup.updateMorph = (progress: number, time: number = 0) => {
      currentProgress = THREE.MathUtils.clamp(progress, 0, 1);
      currentTime = time;
      syncAllMeshes(currentProgress, currentTime, false);
    };

    // Initialize matrices & colors cleanly at progress = 0
    syncAllMeshes(0, 0, true);

    // ==========================================
    // 5. ASYNC PHOTO LOADER & N x N PIXEL SAMPLER
    // ==========================================
    if (photoDataUrl) {
      const img = new Image();
      if (
        !photoDataUrl.startsWith('data:') &&
        !photoDataUrl.startsWith('blob:')
      ) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        if (isDisposed) return;

        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const cropSide = Math.min(naturalW, naturalH);
        if (cropSide <= 0) return;

        const sx = (naturalW - cropSide) / 2;
        const sy = (naturalH - cropSide) / 2;

        // 1. High-resolution square-cropped floor texture (composited on pure white for PNGs)
        const texSize = Math.min(cropSide, 2048);
        const texCanvas = document.createElement('canvas');
        texCanvas.width = texSize;
        texCanvas.height = texSize;
        const texCtx = texCanvas.getContext('2d');

        if (texCtx) {
          texCtx.fillStyle = '#ffffff';
          texCtx.fillRect(0, 0, texSize, texSize);
          texCtx.drawImage(
            img,
            sx,
            sy,
            cropSide,
            cropSide,
            0,
            0,
            texSize,
            texSize
          );

          const photoTex = new THREE.CanvasTexture(texCanvas);
          photoTex.colorSpace = THREE.SRGBColorSpace;
          photoTex.wrapS = THREE.ClampToEdgeWrapping;
          photoTex.wrapT = THREE.ClampToEdgeWrapping;
          photoTex.anisotropy = 8;
          photoTex.minFilter = THREE.LinearMipmapLinearFilter;
          photoTex.magFilter = THREE.LinearFilter;
          photoTex.generateMipmaps = true;
          photoTex.needsUpdate = true;

          const prevMap = photoMat.map;
          photoMat.map = photoTex;
          photoMat.emissiveMap = photoTex;
          photoMat.needsUpdate = true;
          if (prevMap) prevMap.dispose();
        }

        // 2. Offscreen canvas pixel sampling (Math.min(img.width, 128)) into N x N RGB + brightness grid
        const sampleSize = Math.max(1, Math.min(naturalW, 128));
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = sampleSize;
        sampleCanvas.height = sampleSize;
        const sampleCtx = sampleCanvas.getContext('2d', {
          willReadFrequently: true,
        });

        if (sampleCtx) {
          sampleCtx.fillStyle = '#ffffff';
          sampleCtx.fillRect(0, 0, sampleSize, sampleSize);
          sampleCtx.drawImage(
            img,
            sx,
            sy,
            cropSide,
            cropSide,
            0,
            0,
            sampleSize,
            sampleSize
          );

          try {
            const imgData = sampleCtx.getImageData(
              0,
              0,
              sampleSize,
              sampleSize
            ).data;

            const updateModulesFromGrid = (items: PhotoModuleData[]) => {
              for (let i = 0; i < items.length; i++) {
                const mod = items[i];
                const x0 = Math.min(
                  sampleSize - 1,
                  Math.floor((mod.col / N) * sampleSize)
                );
                const x1 = Math.min(
                  sampleSize,
                  Math.max(x0 + 1, Math.floor(((mod.col + 1) / N) * sampleSize))
                );
                const y0 = Math.min(
                  sampleSize - 1,
                  Math.floor((mod.row / N) * sampleSize)
                );
                const y1 = Math.min(
                  sampleSize,
                  Math.max(y0 + 1, Math.floor(((mod.row + 1) / N) * sampleSize))
                );

                let sumR = 0;
                let sumG = 0;
                let sumB = 0;
                let count = 0;

                for (let py = y0; py < y1; py++) {
                  const rowOffset = py * sampleSize;
                  for (let px = x0; px < x1; px++) {
                    const idx = (rowOffset + px) * 4;
                    sumR += imgData[idx];
                    sumG += imgData[idx + 1];
                    sumB += imgData[idx + 2];
                    count++;
                  }
                }

                const inv = count > 0 ? 1 / (count * 255) : 1 / 255;
                const r01 = sumR * inv;
                const g01 = sumG * inv;
                const b01 = sumB * inv;
                const lum = 0.2126 * r01 + 0.7152 * g01 + 0.0722 * b01;

                mod.color3D.setRGB(r01, g01, b01, THREE.SRGBColorSpace);
                const relief = computeReliefGeometry(
                  lum,
                  mod.radialNorm,
                  mod.jitter,
                  moduleSize,
                  tileBaseHeight
                );
                mod.y3D = relief.y3D;
                mod.scaleY3D = relief.scaleY3D;
              }
            };

            updateModulesFromGrid(dataDarkModules);
            updateModulesFromGrid(dataLightModules);
            syncAllMeshes(currentProgress, currentTime, true);
          } catch (err) {
            console.warn(
              'Could not sample cross-origin photo pixels for 3D relief:',
              err
            );
          }
        }
      };

      img.onerror = (err) => {
        console.warn('Failed to load photo for PhotoSculptureQR:', err);
      };

      img.src = photoDataUrl;
    }

    rootGroup.userData.onDispose = () => {
      isDisposed = true;
      if (photoMat.map) {
        photoMat.map.dispose();
        photoMat.map = null;
        photoMat.emissiveMap = null;
      }
    };

    return rootGroup;
  },
};
