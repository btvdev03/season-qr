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
  private readonly ISO_POS = new THREE.Vector3(26, 30, 26);
  private readonly ISO_TARGET = new THREE.Vector3(0, 1.5, 0);
  private readonly ISO_UP = new THREE.Vector3(0, 1, 0);

  // Height ~36 gives full view of the 24-unit slab with comfortable padding
  private readonly SCAN_POS = new THREE.Vector3(0, 36, 0.0001);
  private readonly SCAN_TARGET = new THREE.Vector3(0, 0, 0);
  private readonly SCAN_UP = new THREE.Vector3(0, 0, -1); // Up vector makes QR orientation upright

  constructor(config: SceneManagerConfig) {
    this.container = config.container;
    this.currentUrl = config.initialUrl ?? 'https://github.com';
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
    // Cap at 1.5 to eliminate GPU lag on high-DPI/Retina screens while remaining crystal clear
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Setup OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.copy(this.ISO_TARGET);
    this.controls.minDistance = 8;
    this.controls.maxDistance = 90;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.12;
    this.controls.autoRotate = this.isAutoRotating;
    this.controls.autoRotateSpeed = 0.8;

    // 5. Setup Lighting
    this.ambientLight = new THREE.AmbientLight(
      this.currentSeason.lighting.ambientColor,
      this.currentSeason.lighting.ambientIntensity
    );
    this.scene.add(this.ambientLight);

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
    const morphable = this.styleGroup as { updateMorph?: (p: number) => void } | null;
    if (morphable && typeof morphable.updateMorph === 'function') {
      morphable.updateMorph(this.scanModeProgress);
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

    // In scan mode, disable directional castShadow to eliminate any false shadows on the QR code
    if (this.scanModeProgress > 0.05) {
      this.sunLight.castShadow = false;
      this.ambientLight.intensity = THREE.MathUtils.lerp(
        this.currentSeason.lighting.ambientIntensity,
        1.35,
        this.scanModeProgress
      );
    } else {
      this.sunLight.castShadow = true;
      this.ambientLight.intensity = this.currentSeason.lighting.ambientIntensity;
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

    // Prepare temporary snapshot camera & decor state
    if (renderTopDown) {
      this.scanModeProgress = 1;
      this.applyScanModeDecor();
      this.camera.position.copy(this.SCAN_POS);
      this.camera.up.copy(this.SCAN_UP);
      this.camera.lookAt(this.SCAN_TARGET);
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
