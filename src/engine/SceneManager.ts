/**
 * SeasonQR - 3D Scene Manager
 *
 * Core Three.js runtime orchestrating the WebGL canvas, lighting, camera,
 * OrbitControls, seasonal particle weather, procedural QR styles, smooth
 * isometric <-> top-down transitions, and high-resolution snapshot exports.
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

  // Camera Smooth Transition State
  private isTransitioning: boolean = false;
  private transitionTime: number = 0;
  private transitionDuration: number = 0.85; // seconds
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

  private readonly SCAN_POS = new THREE.Vector3(0, 44, 0.0001);
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

    // 3. Setup WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Necessary for toDataURL export
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Setup OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(this.ISO_TARGET);
    this.controls.minDistance = 8;
    this.controls.maxDistance = 90;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow slight peek under island
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
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.sunLight.shadow.bias = -0.0003;
    this.scene.add(this.sunLight);

    // Subtle rim light for crisp contour separation
    this.rimLight = new THREE.DirectionalLight('#ffffff', 0.35);
    this.rimLight.position.set(-18, 20, -18);
    this.scene.add(this.rimLight);

    // 6. Setup Particles
    this.particles = new WeatherParticleSystem(this.currentSeason);
    this.scene.add(this.particles.group);

    // 7. Initial Build
    this.rebuildScene();

    // 8. Listeners
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
    // Clean up existing style group
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

    this.scene.fog = new THREE.FogExp2(
      lighting.fogColor,
      lighting.fogDensity
    );

    if (this.particles) {
      this.particles.setSeason(this.currentSeason);
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

    const targetPos = mode === 'topDown' ? this.SCAN_POS : this.ISO_POS;
    const targetLook = mode === 'topDown' ? this.SCAN_TARGET : this.ISO_TARGET;
    const targetUp = mode === 'topDown' ? this.SCAN_UP : this.ISO_UP;

    if (!animate) {
      this.camera.position.copy(targetPos);
      this.controls.target.copy(targetLook);
      this.camera.up.copy(targetUp);
      this.camera.lookAt(targetLook);
      this.controls.update();
      this.isTransitioning = false;
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
   * If options.topDown is true, temporarily snaps top-down, renders, and restores camera.
   */
  public async exportSnapshot(options: SnapshotOptions = {}): Promise<string> {
    const width = options.width ?? 1080;
    const height = options.height ?? 1080;
    const renderTopDown = options.topDown ?? false;

    // Save previous state
    const prevWidth = this.container.clientWidth;
    const prevHeight = this.container.clientHeight;
    const prevPos = this.camera.position.clone();
    const prevTarget = this.controls.target.clone();
    const prevUp = this.camera.up.clone();

    // Prepare temporary snapshot camera
    if (renderTopDown) {
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
    this.camera.position.copy(prevPos);
    this.controls.target.copy(prevTarget);
    this.camera.up.copy(prevUp);
    this.camera.aspect = prevWidth / prevHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(prevWidth, prevHeight);

    return dataUrl;
  }

  /**
   * Main animation tick
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // 1. Camera interpolation
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

      if (t >= 1) {
        this.isTransitioning = false;
      }
    } else {
      this.controls.update();
    }

    // 2. Weather particles animation
    if (this.particles) {
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
