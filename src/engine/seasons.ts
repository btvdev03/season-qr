/**
 * SeasonQR - Seasonal Theme Architecture
 *
 * Defines high-contrast color palettes, lighting setups, weather particle attributes,
 * and environmental aesthetics for each season.
 * All ground palettes are carefully tuned for guaranteed camera scan contrast!
 */

export type NaturalSeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export type SeasonId = NaturalSeasonId | 'cyberpunk';

export type WeatherParticleType =
  | 'petals'
  | 'fireflies'
  | 'leaves'
  | 'snow'
  | 'cyber-sparks';

/**
 * Ground & QR Base Palette
 */
export interface GroundPalette {
  /** Raised dark module color */
  darkModule: string;
  /** Light module / base floor color */
  lightModule: string;
  /** Thick ground substrate / island slab color */
  groundSlab: string;
  /** Outer rim bevel / border accent */
  groundRim: string;
  /** High-contrast dark module color specifically for finder patterns */
  finderDark: string;
  /** High-contrast light module color for finder patterns */
  finderLight: string;
}

/**
 * Foliage & Canopy Palette
 */
export interface FoliagePalette {
  /** Main canopy block / leaf color */
  primary: string;
  /** Secondary shading / highlight leaf color */
  secondary: string;
  /** Seasonal accent: sakura blossoms, ripe fruits, maple gold, snow caps, neon crystals */
  accent: string;
  /** Additional tertiary accent */
  subAccent?: string;
}

/**
 * Trunk, Branches & Mineral Palette
 */
export interface StructuralPalette {
  /** Main tree trunk bark / core stone */
  trunkPrimary: string;
  /** Branch highlights / mossy bark */
  trunkSecondary: string;
  /** Base rock / boulder primary color */
  rockPrimary: string;
  /** Base rock highlight / vein color */
  rockSecondary: string;
}

/**
 * 3D Scene Lighting & Atmosphere Configuration
 */
export interface LightingConfig {
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  skyColor: string;
  fogColor: string;
  fogDensity: number;
}

/**
 * Dynamic Atmospheric Weather Particles
 */
export interface WeatherConfig {
  type: WeatherParticleType;
  count: number;
  speed: number;
  size: number;
  colors: string[];
  swayAmplitude: number;
  swayFrequency: number;
  rising: boolean;
}

/**
 * Complete Seasonal Theme Specification
 */
export interface SeasonTheme {
  id: SeasonId;
  name: string;
  vietnameseName: string;
  icon: string;
  description: string;
  vietnameseDescription: string;
  ground: GroundPalette;
  foliage: FoliagePalette;
  structure: StructuralPalette;
  lighting: LightingConfig;
  weather: WeatherConfig;
}

/**
 * Determines the current natural season from the device's system clock.
 * - Spring: February, March, April (months 1, 2, 3)
 * - Summer: May, June, July (months 4, 5, 6)
 * - Autumn: August, September, October (months 7, 8, 9)
 * - Winter: November, December, January (months 10, 11, 0)
 */
export function getCurrentSeason(date: Date = new Date()): NaturalSeasonId {
  const month = date.getMonth();
  if (month >= 1 && month <= 3) return 'spring';
  if (month >= 4 && month <= 6) return 'summer';
  if (month >= 7 && month <= 9) return 'autumn';
  return 'winter';
}

/**
 * Seasonal Themes Dictionary
 */
export const SEASONS: Record<SeasonId, SeasonTheme> = {
  spring: {
    id: 'spring',
    name: 'Spring Blossom',
    vietnameseName: 'Xuân Hoa Anh Đào',
    icon: '🌸',
    description: 'Delicate pink Sakura cherry blossoms drifting in the spring breeze on fresh stone ground.',
    vietnameseDescription: 'Cánh hoa anh đào phớt hồng rơi nhẹ trong gió xuân trên phiến đá cổ kính.',
    ground: {
      darkModule: '#1a0d18', // Deep cherry charcoal for maximum scan contrast
      lightModule: '#fff5f7', // Pale sakura snow
      groundSlab: '#4a2837', // Plum stone slab
      groundRim: '#2b141e',
      finderDark: '#0a0307', // High contrast finder
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#ff85a1', // Sakura cherry pink
      secondary: '#ffc5d3', // Light blossom
      accent: '#fff5f7', // Pure white blossom tips
      subAccent: '#ffe66d', // Golden flower pollen stamen
    },
    structure: {
      trunkPrimary: '#3e2723', // Warm cherry bark
      trunkSecondary: '#5d4037',
      rockPrimary: '#7e8a82',
      rockSecondary: '#99a79e',
    },
    lighting: {
      ambientColor: '#fff0f5',
      ambientIntensity: 0.65,
      sunColor: '#fff8f0',
      sunIntensity: 1.15,
      sunPosition: [16, 28, 16],
      skyColor: '#fdf2f8',
      fogColor: '#fdf2f8',
      fogDensity: 0.005,
    },
    weather: {
      type: 'petals',
      count: 65,
      speed: 0.85,
      size: 0.35,
      colors: ['#f472b6', '#fbcfe8', '#fda4af', '#fff1f2'],
      swayAmplitude: 0.85,
      swayFrequency: 1.8,
      rising: false,
    },
  },

  summer: {
    id: 'summer',
    name: 'Summer Grove',
    vietnameseName: 'Hạ Rực Rỡ',
    icon: '☀️',
    description: 'Vibrant emerald canopy buzzing with golden sunbeams, ripe fruits, and warm fireflies.',
    vietnameseDescription: 'Tán lá ngọc lục bảo rợp bóng dưới nắng vàng, quả chín mọng và đom đóm.',
    ground: {
      darkModule: '#092314', // Deep evergreen black for sharp scan
      lightModule: '#fdfbf4', // Clean warm ivory
      groundSlab: '#1e3f26',
      groundRim: '#0d2818',
      finderDark: '#041208',
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#16a34a', // Lush emerald green
      secondary: '#22c55e', // Bright sunlight leaves
      accent: '#facc15', // Ripe golden summer fruit
      subAccent: '#ef4444', // Sweet ruby berries
    },
    structure: {
      trunkPrimary: '#3d2b18',
      trunkSecondary: '#543b22',
      rockPrimary: '#888277',
      rockSecondary: '#a09a8e',
    },
    lighting: {
      ambientColor: '#f0fdf4',
      ambientIntensity: 0.65,
      sunColor: '#fffef0',
      sunIntensity: 1.15,
      sunPosition: [18, 32, 14],
      skyColor: '#e0f2fe',
      fogColor: '#e2f4ff',
      fogDensity: 0.005,
    },
    weather: {
      type: 'fireflies',
      count: 45,
      speed: 0.6,
      size: 0.3,
      colors: ['#4ade80', '#facc15', '#a3e635', '#86efac'],
      swayAmplitude: 0.6,
      swayFrequency: 1.2,
      rising: true,
    },
  },

  autumn: {
    id: 'autumn',
    name: 'Autumn Gold',
    vietnameseName: 'Thu Lá Đỏ',
    icon: '🍁',
    description: 'Fiery red and golden maple canopy with crisp leaves gently tumbling over rustic earth.',
    vietnameseDescription: 'Sắc lá phong đỏ rực quyện vàng ấm áp, lá thu lượn bay trên nền đất cổ kính.',
    ground: {
      darkModule: '#1f1008', // Deep espresso mahogany (high contrast!)
      lightModule: '#fdf9f2', // Warm parchment white
      groundSlab: '#4a2512',
      groundRim: '#2b1307',
      finderDark: '#0a0502', // Pitch dark for finder eyes
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#dc2626', // Flaming Kyoto maple red
      secondary: '#ea580c', // Deep autumn orange
      accent: '#f59e0b', // Bright golden amber
      subAccent: '#b91c1c',
    },
    structure: {
      trunkPrimary: '#341f17',
      trunkSecondary: '#4e2f23',
      rockPrimary: '#6d6863',
      rockSecondary: '#8a837c',
    },
    lighting: {
      ambientColor: '#fff7ed',
      ambientIntensity: 0.65,
      sunColor: '#ffedd5',
      sunIntensity: 1.15,
      sunPosition: [15, 26, 18],
      skyColor: '#fef3c7',
      fogColor: '#fef3c7',
      fogDensity: 0.005,
    },
    weather: {
      type: 'leaves',
      count: 55,
      speed: 0.9,
      size: 0.38,
      colors: ['#dc2626', '#ea580c', '#f59e0b', '#b91c1c'],
      swayAmplitude: 0.9,
      swayFrequency: 1.5,
      rising: false,
    },
  },

  winter: {
    id: 'winter',
    name: 'Winter Frost',
    vietnameseName: 'Đông Băng Giá',
    icon: '❄️',
    description: 'Crystalline snow-covered pine needles under a soft northern sky with drifting snowflakes.',
    vietnameseDescription: 'Tuyết trắng phủ cành thông băng giá dưới bầu trời phương Bắc tĩnh lặng.',
    ground: {
      darkModule: '#0c152a', // Deep midnight slate blue (high contrast!)
      lightModule: '#f8fafc', // Crisp snow white
      groundSlab: '#1e293b',
      groundRim: '#0f172a',
      finderDark: '#030712',
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#1e3a5f', // Deep alpine slate
      secondary: '#0284c7', // Frost ice blue
      accent: '#ffffff', // Pure fresh snowfall crowns
      subAccent: '#7dd3fc',
    },
    structure: {
      trunkPrimary: '#1e293b',
      trunkSecondary: '#334155',
      rockPrimary: '#475569',
      rockSecondary: '#64748b',
    },
    lighting: {
      ambientColor: '#f0f9ff',
      ambientIntensity: 0.65,
      sunColor: '#f8fafc',
      sunIntensity: 1.15,
      sunPosition: [14, 28, 14],
      skyColor: '#f1f5f9',
      fogColor: '#f1f5f9',
      fogDensity: 0.005,
    },
    weather: {
      type: 'snow',
      count: 70,
      speed: 0.75,
      size: 0.32,
      colors: ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd'],
      swayAmplitude: 0.7,
      swayFrequency: 1.4,
      rising: false,
    },
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    vietnameseName: 'Cyberpunk Tương Lai',
    icon: '⚡',
    description: 'Digital neon grid, luminescent crystal nodes, and cyan data sparks flowing in the dark.',
    vietnameseDescription: 'Mạng lưới dữ liệu phát sáng neon, tinh thể kỹ thuật số và luồng xung điện.',
    ground: {
      darkModule: '#050914', // Pitch black onyx
      lightModule: '#f8fafc', // High contrast crisp light
      groundSlab: '#0f172a',
      groundRim: '#06b6d4',
      finderDark: '#000000',
      finderLight: '#00f5ff',
    },
    foliage: {
      primary: '#d946ef', // Neon fuchsia hologram
      secondary: '#06b6d4', // High-voltage cyan
      accent: '#00f5ff', // Electric laser cyan
      subAccent: '#a855f7',
    },
    structure: {
      trunkPrimary: '#1e1b4b',
      trunkSecondary: '#312e81',
      rockPrimary: '#18181b',
      rockSecondary: '#27272a',
    },
    lighting: {
      ambientColor: '#2e1065',
      ambientIntensity: 0.75,
      sunColor: '#06b6d4',
      sunIntensity: 1.2,
      sunPosition: [12, 24, 12],
      skyColor: '#030712',
      fogColor: '#050a17',
      fogDensity: 0.006,
    },
    weather: {
      type: 'cyber-sparks',
      count: 40,
      speed: 0.8,
      size: 0.35,
      colors: ['#00f0ff', '#ff007f', '#a855f7', '#00ffaa'],
      swayAmplitude: 0.4,
      swayFrequency: 3.5,
      rising: true,
    },
  },
};

/**
 * Returns theme configuration for a given season id (falls back to spring if not found).
 */
export function getSeasonTheme(id: string): SeasonTheme {
  const season = SEASONS[id as SeasonId];
  return season ?? SEASONS.spring;
}

/**
 * Ordered list of all available seasons for UI selector
 */
export const AVAILABLE_SEASONS: SeasonTheme[] = [
  SEASONS.spring,
  SEASONS.summer,
  SEASONS.autumn,
  SEASONS.winter,
  SEASONS.cyberpunk,
];
