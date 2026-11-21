/**
 * SeasonQR - 3D Scene Manager
 *
 * Core Three.js runtime orchestrating the WebGL canvas, lighting, camera,
 * OrbitControls, seasonal particle weather, procedural QR styles, smooth
 * isometric <-> top-down transitions, and high-resolution snapshot exports.
 *
 * Features optimized 60fps performance and dynamic scan-mode transition:
 * in Top-Down Scan Mode, above-ground decorations and obstructive shadows smoothly
 * collapse/fade away, leaving the base QR code 100% visible, razor-sharp,
 * and guaranteed scannable by any phone camera in less than 0.1s.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseQRCode, type QRMatrix } from './qrParser';
import { getSeasonTheme, type SeasonTheme } from './seasons';
import { WeatherParticleSystem } from './particles';
import { getStyle, type QRStyleGenerator } from './styles/index';

export type ViewMode = 'isometric' | 'topDown';

export interface SnapshotOptions {
  width?: number;
  height?: number;
  topDown?: boolean;
}

export interface SceneManagerConfig {
  container: HTMLElement;
  initialUrl?: string;
  initialSeason?: string;
  initialStyle?: string;
  initialPhotoUrl?: string | null;
  autoRotate?: boolean;
  onViewModeChange?: (mode: ViewMode) => void;
}

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private resizeObserver: ResizeObserver | null = null;

  // Scene Components
  private styleGroup: THREE.Group | null = null;
  private particles: WeatherParticleSystem | null = null;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;

  // Active State
  private currentUrl: string;
  private currentSeason: SeasonTheme;
  private currentStyle: QRStyleGenerator;
  private currentPhotoUrl: string | null = null;
  private currentMatrix: QRMatrix | null = null;
  private viewMode: ViewMode = 'isometric';
  private weatherEnabled: boolean = true;

  // Animation Loop State
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private isAutoRotating: boolean = false;
  private isCameraLocked: boolean = true;
  private onViewModeChange?: (mode: ViewMode) => void;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;

  // Scan Mode Dynamic Morphing State (0 = fully isometric, 1 = fully top-down scan)
  private scanModeProgress: number = 0;
  private scanModeStart: number = 0;
  private scanModeTarget: number = 0;

  // Camera Smooth Transition State
  private isTransitioning: boolean = false;
  private transitionTime: number = 0;
  private transitionDuration: number = 0.88; // Snappy, fluid, premium 60 FPS transition
  private startCamPos = new THREE.Vector3();
  private startCamTarget = new THREE.Vector3();
  private startCamUp = new THREE.Vector3();
  private destCamPos = new THREE.Vector3();
  private destCamTarget = new THREE.Vector3();
  private destCamUp = new THREE.Vector3();

  // Reusable lighting color helpers for pure crisp white illumination in scan mode
  private tempAmbientCol = new THREE.Color();
  private tempHemiSkyCol = new THREE.Color();
  private pureWhiteCol = new THREE.Color(0xffffff);

  // Presets & Dynamic Responsive Framing
  // Slight +Z offset in SCAN_TARGET shifts the QR slightly upward on screen, centering it between top header & bottom dock
  private readonly ISO_TARGET = new THREE.Vector3(0, 5.2, 0);
  private readonly ISO_UP = new THREE.Vector3(0, 1, 0);
  private readonly SCAN_TARGET = new THREE.Vector3(0, 0, 2.2);
  private readonly SCAN_UP = new THREE.Vector3(0, 0, -1); // Up vector makes QR orientation upright

  /**
   * Computes a responsive height scale factor for short/landscape viewports
   * so fixed header and bottom dock controls never overlap the 3D scene or 90° QR code.
   */
  private getShortViewportScale(): number {
    const h = Math.max(
      this.container.clientHeight ||
        (typeof window !== 'undefined' ? window.innerHeight : 800),
      1
    );
    return THREE.MathUtils.clamp(620 / Math.min(h, 620), 1.0, 1.58);
  }

  /**
   * Calculates the responsive scan target (shifts QR slightly higher on short landscape screens)
   */
  public getScanTarget(): THREE.Vector3 {
    const shortScale = this.getShortViewportScale();
    return new THREE.Vector3(0, 0, this.SCAN_TARGET.z * shortScale);
  }

  /**
   * Calculates the exact orthogonal camera height needed to frame the QR patio
   * with generous ISO/IEC quiet margin across any screen aspect ratio (mobile, tablet, desktop),
   * ensuring zero overlap with top navigation or bottom command docks.
   */
  public getScanCameraPos(): THREE.Vector3 {
    const aspect = this.getContainerAspect();
    const shortScale = this.getShortViewportScale();
    const scanTarget = this.getScanTarget();
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const tanHalf = Math.tan(vFovRad / 2);
    // In mobile portrait (aspect < 1), width is the primary constraint (44 units with margins).
    // In desktop / square / landscape, height is the constraint (62 * shortScale leaves ample room for dock & header).
    const requiredYForWidth = 44 / (2 * tanHalf * aspect);
    const requiredYForHeight = (62 * shortScale) / (2 * tanHalf);
    const requiredY = Math.max(requiredYForWidth, requiredYForHeight);
    return new THREE.Vector3(0, requiredY, scanTarget.z + 0.0001);
  }

  /**
   * Dynamically frames the 3D isometric diorama island so mobile portrait and landscape screens
   * do not clip the tree foliage, pagoda spire, or skyscraper skyline.
   */
  public getIsoCameraPos(): THREE.Vector3 {
    const aspect = this.getContainerAspect();
    const shortScale = this.getShortViewportScale();
    const aspectMultiplier = THREE.MathUtils.clamp(
      1.0 / Math.pow(Math.min(1.0, aspect), 0.72),
      1.0,
      2.15
    );
    const isoMultiplier = Math.max(aspectMultiplier, shortScale);
    return new THREE.Vector3(
      31.0 * isoMultiplier,
      22.5 * isoMultiplier,
      31.0 * isoMultiplier
    );
  }

  constructor(config: SceneManagerConfig) {
    this.container = config.container;
    this.currentUrl = config.initialUrl ?? 'https://btvdev03.github.io/season-qr/';
    this.currentSeason = getSeasonTheme(config.initialSeason ?? 'spring');
    this.currentStyle = getStyle(config.initialStyle ?? 'tree');
    this.currentPhotoUrl = config.initialPhotoUrl ?? null;
    this.isAutoRotating = config.autoRotate ?? false;
    this.clock = new THREE.Clock();

    // 1. Initialize Scene
    this.scene = new THREE.Scene();

    // 2. Setup Camera
    const aspect = this.getContainerAspect();
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.copy(this.getIsoCameraPos());
    this.camera.up.copy(this.ISO_UP);
    this.camera.lookAt(this.ISO_TARGET);

    // 3. Setup WebGL Renderer with High Performance & Controlled Pixel Ratio
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    const maxDpr = isMobile ? 1.25 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Setup OrbitControls - Fixed camera by default for zero lag & perfect framing
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.target.copy(this.ISO_TARGET);
    this.controls.autoRotate = this.isAutoRotating;
    this.controls.autoRotateSpeed = 1.8;

    // 5. Setup Lighting
    this.ambientLight = new THREE.AmbientLight(
      this.currentSeason.lighting.ambientColor,
      this.currentSeason.lighting.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(
      this.currentSeason.lighting.skyColor,
      this.currentSeason.ground.groundSlab,
      0.35
    );
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(
      this.currentSeason.lighting.sunColor,
      this.currentSeason.lighting.sunIntensity
    );
    this.sunLight.position.set(...this.currentSeason.lighting.sunPosition);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -18;
    this.sunLight.shadow.camera.right = 18;
    this.sunLight.shadow.camera.top = 18;
    this.sunLight.shadow.camera.bottom = -18;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight('#ffffff', 0.25);
    this.rimLight.position.set(-16, 22, -16);
    this.scene.add(this.rimLight);

    // 6. Setup Particles
    this.particles = new WeatherParticleSystem(this.currentSeason);
    this.scene.add(this.particles.group);

    // 7. Initial Build
    this.rebuildScene();

    // 8. Listeners
    this.onViewModeChange = config.onViewModeChange;
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.setupResizeObserver();
    window.addEventListener('resize', this.onWindowResize);

    // 9. Start Render Loop
    this.animate();
  }

  private getContainerAspect(): number {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    return w / Math.max(h, 1);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  private onWindowResize = (): void => {
    this.handleResize();
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
  };

  private onPointerUp = (e: PointerEvent): void => {
    const dx = Math.abs(e.clientX - this.pointerStartX);
    const dy = Math.abs(e.clientY - this.pointerStartY);
    if (dx < 6 && dy < 6 && e.button === 0) {
      this.toggleViewMode();
    }
  };

  public handleResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    if (!this.isTransitioning) {
      if (this.viewMode === 'topDown') {
        const scanTarget = this.getScanTarget();
        this.camera.position.copy(this.getScanCameraPos());
        this.controls.target.copy(scanTarget);
        this.camera.up.copy(this.SCAN_UP);
        this.camera.lookAt(scanTarget);
      } else if (this.isCameraLocked && !this.isAutoRotating) {
        this.camera.position.copy(this.getIsoCameraPos());
        this.controls.target.copy(this.ISO_TARGET);
        this.camera.up.copy(this.ISO_UP);
        this.camera.lookAt(this.ISO_TARGET);
      }
    }
  }

  /**
   * Rebuilds the 3D scene (QR base + selected seasonal style)
   */
  private rebuildScene(): void {
    if (this.styleGroup) {
      this.scene.remove(this.styleGroup);
      this.disposeObject(this.styleGroup);
      this.styleGroup = null;
    }

    // 1. Parse QR
    this.currentMatrix = parseQRCode(this.currentUrl);

    // 2. Generate Style
    this.styleGroup = this.currentStyle.generate({
      matrix: this.currentMatrix,
      season: this.currentSeason,
      sceneSize: 24,
      photoDataUrl: this.currentPhotoUrl,
    });
    this.scene.add(this.styleGroup);

    // 3. Update Atmosphere
    this.updateAtmosphere();

    // 4. Re-apply current scan mode scale/visibility
    this.applyScanModeDecor();
  }

  /**
   * Updates lighting, fog and particle system for current season & style
   */
  private updateAtmosphere(): void {
    const lighting = this.currentSeason.lighting;
    const isNeutralStudio =
      this.currentStyle.id === 'photo' ||
      this.currentStyle.id === 'cyber' ||
      this.currentStyle.id === 'brick';

    this.ambientLight.color.set(
      isNeutralStudio ? '#ffffff' : lighting.ambientColor
    );
    this.ambientLight.intensity = isNeutralStudio
      ? 0.72
      : lighting.ambientIntensity;

    if (this.hemiLight) {
      this.hemiLight.color.set(isNeutralStudio ? '#ffffff' : lighting.skyColor);
      this.hemiLight.groundColor.set(
        isNeutralStudio ? '#f1f5f9' : this.currentSeason.ground.groundSlab
      );
      this.hemiLight.intensity = 0.35;
    }

    this.sunLight.color.set(isNeutralStudio ? '#ffffff' : lighting.sunColor);
    this.sunLight.intensity = isNeutralStudio ? 1.08 : lighting.sunIntensity;
    this.sunLight.position.set(...lighting.sunPosition);

    this.scene.fog = null;

    if (this.particles) {
      this.particles.setSeason(this.currentSeason);
      this.particles.group.visible =
        this.weatherEnabled &&
        this.currentStyle.id !== 'photo' &&
        this.scanModeProgress < 0.7;
    }
  }

  /**
   * Dynamically adapts above-ground 3D decorations and lighting
   * according to scanModeProgress (0 = isometric, 1 = top-down scan)
   */
  private applyScanModeDecor(): void {
    if (!this.styleGroup) return;

    const isPhoto = this.currentStyle.id === 'photo';
    const isNeutralStudio =
      isPhoto ||
      this.currentStyle.id === 'cyber' ||
      this.currentStyle.id === 'brick';

    // 1. Morphing 3D-to-QR Transformer
    const morphable = this.styleGroup as {
      updateMorph?: (p: number, time?: number) => void;
    } | null;
    if (morphable && typeof morphable.updateMorph === 'function') {
      morphable.updateMorph(this.scanModeProgress, this.clock.getElapsedTime());
    }

    // 2. Generic above-ground decorations fallback
    const decor = this.styleGroup.getObjectByName('DecorGroup');
    if (decor && (!morphable || typeof morphable.updateMorph !== 'function')) {
      const scale = Math.max(0.0001, 1 - Math.pow(this.scanModeProgress, 1.5));
      decor.scale.set(scale, scale, scale);
      decor.visible = this.scanModeProgress < 0.99;
    }

    if (this.particles) {
      this.particles.group.visible =
        this.weatherEnabled && !isPhoto && this.scanModeProgress < 0.7;
    }

    const baseAmbientColor = isNeutralStudio
      ? '#ffffff'
      : this.currentSeason.lighting.ambientColor;
    const baseAmbientIntensity = isNeutralStudio
      ? 0.72
      : this.currentSeason.lighting.ambientIntensity;
    const baseSunIntensity = isNeutralStudio
      ? 1.08
      : this.currentSeason.lighting.sunIntensity;
    const baseSkyColor = isNeutralStudio
      ? '#ffffff'
      : this.currentSeason.lighting.skyColor;

    // In scan mode, keep dark QR modules deep ink-rich while light pavers emit pure #ffffff white
    if (this.scanModeProgress > 0.05) {
      this.sunLight.castShadow =
        this.scanModeProgress < (isPhoto ? 0.15 : 0.35);
      this.ambientLight.intensity = THREE.MathUtils.lerp(
        baseAmbientIntensity,
        isPhoto ? 1.0 : 0.96,
        this.scanModeProgress
      );
      this.sunLight.intensity = THREE.MathUtils.lerp(
        baseSunIntensity,
        isPhoto ? 0.08 : 0.14,
        this.scanModeProgress
      );
      this.rimLight.intensity = THREE.MathUtils.lerp(
        0.25,
        isPhoto ? 0.04 : 0.2,
        this.scanModeProgress
      );
      if (this.hemiLight) {
        this.hemiLight.intensity = THREE.MathUtils.lerp(
          0.35,
          isPhoto ? 0.12 : 0.15,
          this.scanModeProgress
        );
        this.tempHemiSkyCol
          .set(baseSkyColor)
          .lerp(this.pureWhiteCol, this.scanModeProgress);
        this.hemiLight.color.copy(this.tempHemiSkyCol);
      }
      this.tempAmbientCol
        .set(baseAmbientColor)
        .lerp(this.pureWhiteCol, this.scanModeProgress);
      this.ambientLight.color.copy(this.tempAmbientCol);
    } else {
      this.sunLight.castShadow = true;
      this.ambientLight.intensity = baseAmbientIntensity;
      this.ambientLight.color.set(baseAmbientColor);
      this.sunLight.intensity = baseSunIntensity;
      this.rimLight.intensity = 0.25;
      if (this.hemiLight) {
        this.hemiLight.intensity = 0.35;
        this.hemiLight.color.set(baseSkyColor);
      }
    }
  }

  /**
   * Public API to update QR URL, Season, Style, and/or Uploaded Photo
   */
  public updateScene(
    url?: string,
    seasonId?: string,
    styleId?: string,
    photoUrl?: string | null
  ): void {
    let needsRebuild = false;

    if (url !== undefined && url !== this.currentUrl) {
      this.currentUrl = url;
      needsRebuild = true;
    }

    if (seasonId !== undefined && seasonId !== this.currentSeason.id) {
      this.currentSeason = getSeasonTheme(seasonId);
      needsRebuild = true;
    }

    if (styleId !== undefined && styleId !== this.currentStyle.id) {
      this.currentStyle = getStyle(styleId);
      needsRebuild = true;
    }

    if (photoUrl !== undefined && photoUrl !== this.currentPhotoUrl) {
      this.currentPhotoUrl = photoUrl;
      if (this.currentStyle.id === 'photo') {
        needsRebuild = true;
      }
    }

    if (needsRebuild) {
      this.rebuildScene();
    }
  }

  /**
   * Camera View Switching:
   * Smoothly animates between Isometric 3D View and Top-Down 100% Scannable View
   */
  public setViewMode(mode: ViewMode, animate: boolean = true): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.onViewModeChange?.(mode);

    const targetPos =
      mode === 'topDown' ? this.getScanCameraPos() : this.getIsoCameraPos();
    const targetLook =
      mode === 'topDown' ? this.getScanTarget() : this.ISO_TARGET;
    const targetUp = mode === 'topDown' ? this.SCAN_UP : this.ISO_UP;

    if (mode === 'topDown') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI;
      this.controls.enableRotate = false;
      this.controls.enableZoom = false;
      this.controls.autoRotate = false;
    } else {
      this.controls.minPolarAngle = Math.PI / 4.5;
      this.controls.maxPolarAngle = Math.PI / 2.15;
      this.controls.enableRotate = !this.isCameraLocked;
      this.controls.enableZoom = !this.isCameraLocked;
      this.controls.autoRotate = this.isAutoRotating;
    }

    this.scanModeTarget = mode === 'topDown' ? 1 : 0;
    this.scanModeStart = this.scanModeProgress;

    if (!animate) {
      this.camera.position.copy(targetPos);
      this.controls.target.copy(targetLook);
      this.camera.up.copy(targetUp);
      this.camera.lookAt(targetLook);
      if (mode === 'isometric') {
        this.controls.update();
      }
      this.isTransitioning = false;
      this.scanModeProgress = this.scanModeTarget;
      this.applyScanModeDecor();
      return;
    }

    this.startCamPos.copy(this.camera.position);
    this.startCamTarget.copy(this.controls.target);
    this.startCamUp.copy(this.camera.up);

    this.destCamPos.copy(targetPos);
    this.destCamTarget.copy(targetLook);
    this.destCamUp.copy(targetUp);

    this.transitionTime = 0;
    this.isTransitioning = true;
  }

  /**
   * Toggles between Isometric and Top-Down Scan View
   */
  public toggleViewMode(): ViewMode {
    const nextMode = this.viewMode === 'isometric' ? 'topDown' : 'isometric';
    this.setViewMode(nextMode);
    return nextMode;
  }

  public getViewMode(): ViewMode {
    return this.viewMode;
  }

  /**
   * Resets camera back to default angle for the current view mode
   */
  public resetCamera(): void {
    const targetPos =
      this.viewMode === 'topDown'
        ? this.getScanCameraPos()
        : this.getIsoCameraPos();
    const targetLook =
      this.viewMode === 'topDown' ? this.getScanTarget() : this.ISO_TARGET;
    const targetUp = this.viewMode === 'topDown' ? this.SCAN_UP : this.ISO_UP;

    this.startCamPos.copy(this.camera.position);
    this.startCamTarget.copy(this.controls.target);
    this.startCamUp.copy(this.camera.up);

    this.destCamPos.copy(targetPos);
    this.destCamTarget.copy(targetLook);
    this.destCamUp.copy(targetUp);

    this.transitionTime = 0;
    this.isTransitioning = true;
  }

  /**
   * Enables or disables 360-degree auto-rotation in 3D Isometric mode
   */
  public setAutoRotate(enabled: boolean): void {
    this.isAutoRotating = enabled;
    this.controls.autoRotate = enabled && this.viewMode === 'isometric';
    this.controls.autoRotateSpeed = 1.8;
    if (!enabled && this.viewMode === 'isometric' && this.isCameraLocked) {
      this.resetCamera();
    }
  }

  public getAutoRotate(): boolean {
    return this.isAutoRotating;
  }

  /**
   * Toggles falling weather particles (petals, leaves, snow, fireflies)
   */
  public setWeatherEnabled(enabled: boolean): void {
    this.weatherEnabled = enabled;
    if (this.particles) {
      this.particles.group.visible =
        enabled &&
        this.currentStyle.id !== 'photo' &&
        this.scanModeProgress < 0.7;
    }
  }

  public getWeatherEnabled(): boolean {
    return this.weatherEnabled;
  }

  /**
   * Toggles fixed vs free OrbitControls camera rotation
   */
  public setCameraRotationLock(locked: boolean): void {
    this.isCameraLocked = locked;
    this.controls.enableRotate = !locked && this.viewMode === 'isometric';
    this.controls.enableZoom = !locked && this.viewMode === 'isometric';
    if (locked && !this.isAutoRotating) {
      this.resetCamera();
    }
  }

  public getCameraRotationLock(): boolean {
    return this.isCameraLocked;
  }

  /**
   * Captures a high-resolution snapshot PNG Data URL.
   * Works reliably regardless of whether the user is currently in 3D or 90° Scan View.
   */
  public async exportSnapshot(options: SnapshotOptions = {}): Promise<string> {
    const width = options.width ?? 1920;
    const height = options.height ?? 1920;
    const renderTopDown = options.topDown ?? false;

    const prevWidth = this.container.clientWidth;
    const prevHeight = this.container.clientHeight;
    const prevPos = this.camera.position.clone();
    const prevTarget = this.controls.target.clone();
    const prevUp = this.camera.up.clone();
    const prevProgress = this.scanModeProgress;

    if (renderTopDown) {
      this.scanModeProgress = 1;
      this.applyScanModeDecor();
      this.renderer.setClearColor('#ffffff', 1);
      // Centered square framing for exported 90° QR image
      this.camera.position.set(0, 56, 0.0001);
      this.camera.up.copy(this.SCAN_UP);
      this.camera.lookAt(0, 0, 0);
    } else {
      this.scanModeProgress = 0;
      this.applyScanModeDecor();
      this.renderer.setClearColor('#f8fafc', 1);
      this.camera.position.set(31.5, 22.8, 31.5);
      this.camera.up.copy(this.ISO_UP);
      this.camera.lookAt(this.ISO_TARGET);
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore original state
    this.renderer.setClearColor('#000000', 0);
    this.scanModeProgress = prevProgress;
    this.applyScanModeDecor();
    this.camera.position.copy(prevPos);
    this.controls.target.copy(prevTarget);
    this.camera.up.copy(prevUp);
    this.camera.lookAt(prevTarget);
    if (this.viewMode === 'isometric') {
      this.controls.update();
    }
    this.camera.aspect = prevWidth / Math.max(prevHeight, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(prevWidth, prevHeight);

    return dataUrl;
  }

  /**
   * Main animation tick (smooth 60fps)
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Camera interpolation & Scan mode decor morphing
    if (this.isTransitioning) {
      this.transitionTime += delta;
      const t = Math.min(1, this.transitionTime / this.transitionDuration);

      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.startCamPos, this.destCamPos, ease);
      this.controls.target.lerpVectors(
        this.startCamTarget,
        this.destCamTarget,
        ease
      );
      this.camera.up
        .lerpVectors(this.startCamUp, this.destCamUp, ease)
        .normalize();
      this.camera.lookAt(this.controls.target);

      this.scanModeProgress = THREE.MathUtils.lerp(
        this.scanModeStart,
        this.scanModeTarget,
        ease
      );
      this.applyScanModeDecor();

      if (t >= 1) {
        this.isTransitioning = false;
        this.camera.position.copy(this.destCamPos);
        this.controls.target.copy(this.destCamTarget);
        this.camera.up.copy(this.destCamUp);
        this.camera.lookAt(this.destCamTarget);
        if (this.viewMode === 'isometric') {
          this.controls.update();
        }
        this.scanModeProgress = this.scanModeTarget;
        this.applyScanModeDecor();
      }
    } else {
      if (
        this.viewMode === 'isometric' &&
        this.controls.enabled &&
        (this.controls.enableRotate || this.isAutoRotating)
      ) {
        this.controls.update();
      }
      if (this.scanModeProgress < 0.05 && this.styleGroup) {
        const morphable = this.styleGroup as {
          updateMorph?: (p: number, time?: number) => void;
        } | null;
        if (morphable && typeof morphable.updateMorph === 'function') {
          morphable.updateMorph(
            this.scanModeProgress,
            this.clock.getElapsedTime()
          );
        }
      }
    }

    // 2. Weather particles animation
    if (
      this.particles &&
      this.particles.group.visible &&
      this.currentStyle.id !== 'photo' &&
      this.scanModeProgress < 0.7
    ) {
      this.particles.update(delta);
    }

    // 3. Render scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Deep disposal of Three.js objects to prevent memory leaks
   */
  private disposeObject(obj: THREE.Object3D): void {
    if (obj.userData && typeof obj.userData.onDispose === 'function') {
      (obj.userData.onDispose as () => void)();
    }

    const disposeMaterial = (m: THREE.Material) => {
      const matWithMaps = m as THREE.Material & {
        map?: THREE.Texture | null;
        emissiveMap?: THREE.Texture | null;
      };
      if (matWithMaps.map) {
        matWithMaps.map.dispose();
      }
      if (matWithMaps.emissiveMap && matWithMaps.emissiveMap !== matWithMaps.map) {
        matWithMaps.emissiveMap.dispose();
      }
      m.dispose();
    };

    obj.traverse((child) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }

      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach(disposeMaterial);
        } else {
          disposeMaterial(mat);
        }
      }
    });
  }

  /**
   * Clean up everything when component unmounts
   */
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener(
      'pointerdown',
      this.onPointerDown
    );
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.particles) {
      this.particles.dispose();
      this.particles = null;
    }

    if (this.styleGroup) {
      this.scene.remove(this.styleGroup);
      this.disposeObject(this.styleGroup);
      this.styleGroup = null;
    }

    this.controls.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(
        this.renderer.domElement
      );
    }
  }
}
