/**
 * SeasonQR - Atmospheric Weather Particle System
 *
 * Implements GPU-accelerated weather particles using THREE.Points and procedural
 * canvas sprite textures (zero network dependencies):
 * - Spring: Falling cherry blossom petals swaying in the breeze
 * - Summer: Warm glowing fireflies floating upwards with harmonic drift
 * - Autumn: Red/orange/golden maple leaves fluttering downwards
 * - Winter: Crystalline snowflakes drifting gently with wind sway
 * - Cyberpunk: Neon data sparks / holographic bits rising and glitching
 */

import * as THREE from 'three';
import type { SeasonTheme, WeatherParticleType } from './seasons';

interface ParticleData {
  baseX: number;
  baseZ: number;
  y: number;
  speed: number;
  swayPhase: number;
  swaySpeed: number;
  amplitude: number;
  colorIdx: number;
}

/**
 * Creates a procedural sprite canvas texture based on weather particle type
 */
function createParticleTexture(type: WeatherParticleType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    return fallback;
  }

  ctx.clearRect(0, 0, 64, 64);

  switch (type) {
    case 'petals': {
      // Sakura petal: elegant teardrop shape with slight notch
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(-Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.bezierCurveTo(14, -22, 22, -4, 18, 12);
      ctx.bezierCurveTo(14, 22, 0, 24, 0, 24);
      ctx.bezierCurveTo(0, 24, -14, 22, -18, 12);
      ctx.bezierCurveTo(-22, -4, -14, -22, 0, -22);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Soft petal center shading
      const grad = ctx.createRadialGradient(0, 5, 2, 0, 5, 20);
      grad.addColorStop(0, 'rgba(255, 220, 230, 0.9)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'fireflies': {
      // Soft glowing orb with intense bright core and ethereal halo
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.2, 'rgba(255, 245, 170, 0.9)');
      grad.addColorStop(0.5, 'rgba(255, 215, 60, 0.45)');
      grad.addColorStop(1, 'rgba(255, 200, 40, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'leaves': {
      // Stylized 5-pointed maple leaf silhouette
      ctx.save();
      ctx.translate(32, 32);
      ctx.beginPath();
      ctx.moveTo(0, -26); // Top tip
      ctx.lineTo(6, -10);
      ctx.lineTo(24, -14); // Upper right lobe
      ctx.lineTo(14, 2);
      ctx.lineTo(22, 16); // Lower right lobe
      ctx.lineTo(6, 12);
      ctx.lineTo(0, 26); // Stem base
      ctx.lineTo(-6, 12);
      ctx.lineTo(-22, 16); // Lower left lobe
      ctx.lineTo(-14, 2);
      ctx.lineTo(-24, -14); // Upper left lobe
      ctx.lineTo(-6, -10);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Subtle leaf vein highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(0, -18);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'snow': {
      // Crystalline hexagonal snowflake with glowing core
      const grad = ctx.createRadialGradient(32, 32, 3, 32, 32, 26);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.4, 'rgba(235, 245, 255, 0.85)');
      grad.addColorStop(0.8, 'rgba(200, 230, 255, 0.3)');
      grad.addColorStop(1, 'rgba(180, 220, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 26, 0, Math.PI * 2);
      ctx.fill();

      // 6-arm crystal star
      ctx.save();
      ctx.translate(32, 32);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 18);
        // Small branchlets
        ctx.moveTo(0, 11);
        ctx.lineTo(4, 15);
        ctx.moveTo(0, 11);
        ctx.lineTo(-4, 15);
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
      }
      ctx.restore();
      break;
    }

    case 'cyber-sparks': {
      // Glowing neon diamond / digital data packet
      ctx.save();
      ctx.translate(32, 32);

      // Outer glow
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 26);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.9)');
      grad.addColorStop(0.7, 'rgba(255, 0, 160, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      // Sharp central diamond
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class WeatherParticleSystem {
  public group: THREE.Group;
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private particleData: ParticleData[] = [];
  private positions: Float32Array | null = null;
  private colors: Float32Array | null = null;
  private currentSeason: SeasonTheme;
  private sceneBounds = {
    minX: -18,
    maxX: 18,
    minZ: -18,
    maxZ: 18,
    minY: 0.2,
    maxY: 22,
  };
  private totalTime: number = 0;

  constructor(season: SeasonTheme, boundsRadius: number = 18) {
    this.group = new THREE.Group();
    this.group.name = 'WeatherParticleSystem';
    this.currentSeason = season;
    this.sceneBounds = {
      minX: -boundsRadius,
      maxX: boundsRadius,
      minZ: -boundsRadius,
      maxZ: boundsRadius,
      minY: 0.2,
      maxY: boundsRadius * 1.3,
    };
    this.init();
  }

  /**
   * Initializes or rebuilds the particle system
   */
  public init(): void {
    this.cleanup();

    const weather = this.currentSeason.weather;
    const count = weather.count;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.particleData = [];

    // Pre-parse theme colors into THREE.Color
    const parsedColors = weather.colors.map((c) => new THREE.Color(c));

    for (let i = 0; i < count; i++) {
      const baseX =
        this.sceneBounds.minX +
        Math.random() * (this.sceneBounds.maxX - this.sceneBounds.minX);
      const baseZ =
        this.sceneBounds.minZ +
        Math.random() * (this.sceneBounds.maxZ - this.sceneBounds.minZ);
      const y =
        this.sceneBounds.minY +
        Math.random() * (this.sceneBounds.maxY - this.sceneBounds.minY);

      const colorIdx = i % parsedColors.length;
      const color = parsedColors[colorIdx];

      this.positions[i * 3 + 0] = baseX;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = baseZ;

      this.colors[i * 3 + 0] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;

      this.particleData.push({
        baseX,
        baseZ,
        y,
        speed: weather.speed * (0.7 + Math.random() * 0.6),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: weather.swayFrequency * (0.8 + Math.random() * 0.4),
        amplitude: weather.swayAmplitude * (0.7 + Math.random() * 0.6),
        colorIdx,
      });
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3)
    );

    this.texture = createParticleTexture(weather.type);

    this.material = new THREE.PointsMaterial({
      size: weather.size * 2.2,
      map: this.texture,
      transparent: true,
      opacity: weather.type === 'cyber-sparks' ? 0.95 : 0.85,
      vertexColors: true,
      depthWrite: false,
      blending:
        weather.type === 'fireflies' || weather.type === 'cyber-sparks'
          ? THREE.AdditiveBlending
          : THREE.NormalBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  /**
   * Switches to a new seasonal theme
   */
  public setSeason(newSeason: SeasonTheme): void {
    this.currentSeason = newSeason;
    this.init();
  }

  /**
   * Updates particle positions smoothly on each animation tick
   */
  public update(delta: number): void {
    if (!this.points || !this.positions || !this.geometry) return;

    this.totalTime += delta;
    const weather = this.currentSeason.weather;
    const isRising = weather.rising;
    const { minY, maxY, minX, maxX, minZ, maxZ } = this.sceneBounds;

    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];

      // Vertical movement
      if (isRising) {
        p.y += p.speed * delta;
        if (p.y > maxY) {
          p.y = minY;
          p.baseX = minX + Math.random() * (maxX - minX);
          p.baseZ = minZ + Math.random() * (maxZ - minZ);
        }
      } else {
        p.y -= p.speed * delta;
        if (p.y < minY) {
          p.y = maxY;
          p.baseX = minX + Math.random() * (maxX - minX);
          p.baseZ = minZ + Math.random() * (maxZ - minZ);
        }
      }

      // Horizontal organic sway
      const sway = Math.sin(this.totalTime * p.swaySpeed + p.swayPhase);
      const swayCos = Math.cos(this.totalTime * p.swaySpeed * 0.7 + p.swayPhase);

      const posX = p.baseX + sway * p.amplitude;
      const posZ = p.baseZ + swayCos * p.amplitude;

      this.positions[i * 3 + 0] = posX;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = posZ;
    }

    this.geometry.attributes.position.needsUpdate = true;

    // Subtle breathing pulse for glowing particles (fireflies / sparks)
    if (
      this.material &&
      (weather.type === 'fireflies' || weather.type === 'cyber-sparks')
    ) {
      this.material.size =
        weather.size * 2.2 * (0.85 + Math.sin(this.totalTime * 3) * 0.15);
    }
  }

  /**
   * Frees GPU resources
   */
  public cleanup(): void {
    if (this.points) {
      this.group.remove(this.points);
      this.points = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    this.positions = null;
    this.colors = null;
    this.particleData = [];
  }

  public dispose(): void {
    this.cleanup();
  }
}
