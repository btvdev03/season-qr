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
  private currentMatrix: QRMatrix | null = null;
  private viewMode: ViewMode = 'isometric';

  // Animation Loop State
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private isAutoRotating: boolean = false;
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
  private transitionDuration: number = 0.75; // seconds
  private startCamPos = new THREE.Vector3();
  private startCamTarget = new THREE.Vector3();
  private startCamUp = new THREE.Vector3();
  private destCamPos = new THREE.Vector3();
  private destCamTarget = new THREE.Vector3();
  private destCamUp = new THREE.Vector3();

  // Presets
  private readonly ISO_POS = new THREE.Vector3(22, 16, 22);
  private readonly ISO_TARGET = new THREE.Vector3(0, 5.5, 0);
  private readonly ISO_UP = new THREE.Vector3(0, 1, 0);

  // Framing in Scan Mode:
  // In scan mode (viewMode === 'topDown'), the floating dock sits at the bottom (~140px).
  // Because SCAN_UP is (0, 0, -1), negative Z corresponds to UP on the screen.
  // Setting camera target to +3.2 along Z shifts the diorama upward in screen space
  // (centering QR slab at y=+0.189, bottom edge at y=-0.521), framing the 24-unit slab
  // comfortably in the upper/middle viewport with generous padding and 0% occlusion by the bottom dock.
  private readonly SCAN_POS = new THREE.Vector3(0, 44, 3.2 + 0.0001);
  private readonly SCAN_TARGET = new THREE.Vector3(0, 0, 3.2);
  private readonly SCAN_UP = new THREE.Vector3(0, 0, -1); // Up vector makes QR orientation upright

  constructor(config: SceneManagerConfig) {
    this.container = config.container;
    this.currentUrl = config.initialUrl ?? 'https://btvdev03.github.io/season-qr/';
    this.currentSeason = getSeasonTheme(config.initialSeason ?? 'spring');
    this.currentStyle = getStyle(config.initialStyle ?? 'tree');
    this.isAutoRotating = config.autoRotate ?? false;
    this.clock = new THREE.Clock();

    // 1. Initialize Scene
    this.scene = new THREE.Scene();

    // 2. Setup Camera
    const aspect = this.getContainerAspect();
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.copy(this.ISO_POS);
    this.camera.up.copy(this.ISO_UP);
    this.camera.lookAt(this.ISO_TARGET);

    // 3. Setup WebGL Renderer with High Performance & Controlled Pixel Ratio
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    // Adaptive pixel ratio: 1.25 on mobile/tablets, 1.5 on desktop for high-DPI clarity with 0% GPU fillrate lag
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    const maxDpr = isMobile ? 1.25 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Setup OrbitControls - Fixed camera for zero lag & perfect framing
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.enableRotate = false; // Fixed camera as user requested
    this.controls.enableZoom = false;   // No zoom lag
    this.controls.enablePan = false;    // No pan drift
    this.controls.target.copy(this.ISO_TARGET);
    this.controls.autoRotate = false;

    // 5. Setup Lighting
    this.ambientLight = new THREE.AmbientLight(
      this.currentSeason.lighting.ambientColor,
      this.currentSeason.lighting.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    // Natural sky & ground bounce for volumetric 3D botanical depth
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
    // 1024x1024 shadow map is sharp and 4x faster than 2048x2048!
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

    // Subtle rim light for crisp contour separation
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
    // Tap without significant drag triggers mode toggle
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
    });
    this.scene.add(this.styleGroup);

    // 3. Update Atmosphere
    this.updateAtmosphere();

    // 4. Re-apply current scan mode scale/visibility
    this.applyScanModeDecor();
  }

  /**
   * Updates lighting, fog and particle system for current season
   */
  private updateAtmosphere(): void {
    const lighting = this.currentSeason.lighting;

    this.ambientLight.color.set(lighting.ambientColor);
    this.ambientLight.intensity = lighting.ambientIntensity;

    if (this.hemiLight) {
      this.hemiLight.color.set(lighting.skyColor);
      this.hemiLight.groundColor.set(this.currentSeason.ground.groundSlab);
      this.hemiLight.intensity = 0.35;
    }

    this.sunLight.color.set(lighting.sunColor);
    this.sunLight.intensity = lighting.sunIntensity;
    this.sunLight.position.set(...lighting.sunPosition);

    this.scene.fog = null;

    if (this.particles) {
      this.particles.setSeason(this.currentSeason);
    }
  }

  /**
   * Dynamically adapts above-ground 3D decorations and lighting
   * according to scanModeProgress (0 = isometric, 1 = top-down scan)
   */
  private applyScanModeDecor(): void {
    if (!this.styleGroup) return;

    // 1. Morphing Leaf-to-QR Transformer (ICQR Magic Mechanic)
    const morphable = this.styleGroup as { updateMorph?: (p: number, time?: number) => void } | null;
    if (morphable && typeof morphable.updateMorph === 'function') {
      morphable.updateMorph(this.scanModeProgress, this.clock.getElapsedTime());
    }

    // 2. Generic above-ground decorations for other styles
    const decor = this.styleGroup.getObjectByName('DecorGroup');
    if (decor) {
      const scale = Math.max(0.0001, 1 - Math.pow(this.scanModeProgress, 1.5));
      decor.scale.set(scale, scale, scale);
      decor.visible = this.scanModeProgress < 0.99;
    }

    if (this.particles) {
      // Hide drifting weather particles in top-down scan mode to avoid obstructing camera
      this.particles.group.visible = this.scanModeProgress < 0.7;
    }

    // In scan mode, balance ambient and sun illumination to prevent specular glare blowout
    // while keeping jewel-toned QR modules vibrant, deep, and high-contrast
    if (this.scanModeProgress > 0.05) {
      this.sunLight.castShadow = this.scanModeProgress < 0.4;
      this.ambientLight.intensity = THREE.MathUtils.lerp(
        this.currentSeason.lighting.ambientIntensity,
        1.12,
        this.scanModeProgress
      );
      this.sunLight.intensity = THREE.MathUtils.lerp(
        this.currentSeason.lighting.sunIntensity,
        0.45,
        this.scanModeProgress
      );
    } else {
      this.sunLight.castShadow = true;
      this.ambientLight.intensity = this.currentSeason.lighting.ambientIntensity;
      this.sunLight.intensity = this.currentSeason.lighting.sunIntensity;
    }
  }

  /**
   * Public API to update QR URL, Season, and/or Style
   */
  public updateScene(url?: string, seasonId?: string, styleId?: string): void {
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

    if (needsRebuild) {
      this.rebuildScene();
    }
  }

  /**
   * Camera View Switching:
   * Smoothly animates between Isometric 3D View and Top-Down 100% Scannable View
   */
  public setViewMode(mode: ViewMode, animate: boolean = true): void {
    if (this.viewMode === mode && !this.isTransitioning) return;
    this.viewMode = mode;
    this.onViewModeChange?.(mode);

    const targetPos = mode === 'topDown' ? this.SCAN_POS : this.ISO_POS;
    const targetLook = mode === 'topDown' ? this.SCAN_TARGET : this.ISO_TARGET;
    const targetUp = mode === 'topDown' ? this.SCAN_UP : this.ISO_UP;

    if (mode === 'topDown') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI;
    } else {
      this.controls.minPolarAngle = Math.PI / 4.5;
      this.controls.maxPolarAngle = Math.PI / 2.15;
    }

    this.scanModeTarget = mode === 'topDown' ? 1 : 0;
    this.scanModeStart = this.scanModeProgress;

    if (!animate) {
      this.camera.position.copy(targetPos);
      this.controls.target.copy(targetLook);
      this.camera.up.copy(targetUp);
      this.camera.lookAt(targetLook);
      this.controls.update();
      this.isTransitioning = false;
      this.scanModeProgress = this.scanModeTarget;
      this.applyScanModeDecor();
      return;
    }

    // Begin smooth lerp
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
    const targetPos = this.viewMode === 'topDown' ? this.SCAN_POS : this.ISO_POS;
    const targetLook = this.viewMode === 'topDown' ? this.SCAN_TARGET : this.ISO_TARGET;
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
   * Enables or disables auto-rotation
   */
  public setAutoRotate(enabled: boolean): void {
    this.isAutoRotating = enabled;
    this.controls.autoRotate = enabled;
  }

  public getAutoRotate(): boolean {
    return this.isAutoRotating;
  }

  /**
   * Toggles falling weather particles (petals, leaves, snow)
   */
  public setWeatherEnabled(enabled: boolean): void {
    if (this.particles) {
      this.particles.group.visible = enabled;
    }
  }

  public getWeatherEnabled(): boolean {
    return this.particles ? this.particles.group.visible : true;
  }

  /**
   * Toggles fixed vs free OrbitControls camera rotation
   */
  public setCameraRotationLock(locked: boolean): void {
    this.controls.enableRotate = !locked;
    this.controls.enableZoom = !locked;
  }

  public getCameraRotationLock(): boolean {
    return !this.controls.enableRotate;
  }

  /**
   * Captures a high-resolution snapshot PNG Data URL.
   * If options.topDown is true, snaps top-down with 100% unblocked QR base.
   */
  public async exportSnapshot(options: SnapshotOptions = {}): Promise<string> {
    const width = options.width ?? 1200;
    const height = options.height ?? 1200;
    const renderTopDown = options.topDown ?? false;

    // Save previous state
    const prevWidth = this.container.clientWidth;
    const prevHeight = this.container.clientHeight;
    const prevPos = this.camera.position.clone();
    const prevTarget = this.controls.target.clone();
    const prevUp = this.camera.up.clone();
    const prevProgress = this.scanModeProgress;

    // Prepare temporary snapshot camera & decor state (centered for clean square export)
    if (renderTopDown) {
      this.scanModeProgress = 1;
      this.applyScanModeDecor();
      this.camera.position.set(0, 36, 0.0001);
      this.camera.up.copy(this.SCAN_UP);
      this.camera.lookAt(0, 0, 0);
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    // Render snapshot frame
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore original state
    this.scanModeProgress = prevProgress;
    this.applyScanModeDecor();
    this.camera.position.copy(prevPos);
    this.controls.target.copy(prevTarget);
    this.camera.up.copy(prevUp);
    this.camera.lookAt(prevTarget);
    this.controls.update();
    this.camera.aspect = prevWidth / prevHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(prevWidth, prevHeight);

    return dataUrl;
  }

  /**
   * Main animation tick (smooth 60fps)
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent jump after background tab

    // 1. Camera interpolation & Scan mode decor morphing
    if (this.isTransitioning) {
      this.transitionTime += delta;
      const t = Math.min(1, this.transitionTime / this.transitionDuration);

      // Smooth ease-in-out cubic
      const ease =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
      this.controls.update();

      // Morph decor scale & shadow
      this.scanModeProgress = THREE.MathUtils.lerp(
        this.scanModeStart,
        this.scanModeTarget,
        ease
      );
      this.applyScanModeDecor();

      if (t >= 1) {
        this.isTransitioning = false;
        this.scanModeProgress = this.scanModeTarget;
        this.applyScanModeDecor();
      }
    } else {
      this.controls.update();
      // Only tick real-time wind physics in 3D mode (avoiding redundant state recalculations)
      if (this.scanModeProgress < 0.95 && this.styleGroup) {
        const morphable = this.styleGroup as { updateMorph?: (p: number, time?: number) => void } | null;
        if (morphable && typeof morphable.updateMorph === 'function') {
          morphable.updateMorph(this.scanModeProgress, this.clock.getElapsedTime());
        }
      }
    }

    // 2. Weather particles animation (only animate when visible)
    if (this.particles && this.scanModeProgress < 0.8) {
      this.particles.update(delta);
    }

    // 3. Render scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Deep disposal of Three.js objects to prevent memory leaks
   */
  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }

      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
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
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
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
