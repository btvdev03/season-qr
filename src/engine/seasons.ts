/**
 * SeasonQR - Seasonal Theme Architecture
 *
 * Defines color palettes, lighting setups, weather particle attributes,
 * and environmental acoustics/aesthetics for each season.
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
    description: 'Gentle pink cherry blossoms drifting in the spring breeze on fresh mossy ground.',
    vietnameseDescription: 'Cánh hoa anh đào phớt hồng rơi nhẹ trong gió xuân trên nền rêu biếc.',
    ground: {
      darkModule: '#2d5a3c',
      lightModule: '#fbf9f1',
      groundSlab: '#507855',
      groundRim: '#3b5c40',
      finderDark: '#1b432a',
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#ff9ebb', // Sakura cherry pink
      secondary: '#ffc5d3', // Light blossom
      accent: '#fff5f7', // Pure white blossom tips
      subAccent: '#ffe66d', // Golden flower pollen stamen
    },
    structure: {
      trunkPrimary: '#543d2b', // Warm cherry bark
      trunkSecondary: '#6e513b',
      rockPrimary: '#7e8a82',
      rockSecondary: '#99a79e',
    },
    lighting: {
      ambientColor: '#ffeef4',
      ambientIntensity: 0.85,
      sunColor: '#fff9e6',
      sunIntensity: 1.5,
      sunPosition: [18, 30, 18],
      skyColor: '#eef6fc',
      fogColor: '#f2f7fb',
      fogDensity: 0.008,
    },
    weather: {
      type: 'petals',
      count: 180,
      speed: 1.1,
      size: 0.32,
      colors: ['#ffb3c6', '#ff8fa3', '#ffe5ec', '#ffccd5'],
      swayAmplitude: 0.8,
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
      darkModule: '#1b4d2e',
      lightModule: '#fdfbf2',
      groundSlab: '#2e5b34',
      groundRim: '#1a3c20',
      finderDark: '#0e331b',
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#27ae60', // Lush emerald green
      secondary: '#2ecc71', // Bright sunlight leaves
      accent: '#f39c12', // Ripe golden summer fruit
      subAccent: '#e74c3c', // Sweet ruby berries
    },
    structure: {
      trunkPrimary: '#4a3319', // Deep aged oak bark
      trunkSecondary: '#634724',
      rockPrimary: '#888277',
      rockSecondary: '#a09a8e',
    },
    lighting: {
      ambientColor: '#fff2db',
      ambientIntensity: 0.9,
      sunColor: '#fff8db',
      sunIntensity: 1.65,
      sunPosition: [20, 36, 16],
      skyColor: '#e0f2fe',
      fogColor: '#e2f4ff',
      fogDensity: 0.006,
    },
    weather: {
      type: 'fireflies',
      count: 120,
      speed: 0.65,
      size: 0.28,
      colors: ['#f9d71c', '#ffe66d', '#80ed99', '#a7f3d0'],
      swayAmplitude: 0.6,
      swayFrequency: 1.2,
      rising: true, // Fireflies float upwards gently!
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
      darkModule: '#5e2d14',
      lightModule: '#fcf6ec',
      groundSlab: '#784323',
      groundRim: '#48240f',
      finderDark: '#3b1807',
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#d35400', // Flaming pumpkin orange
      secondary: '#c0392b', // Deep maple red
      accent: '#f1c40f', // Bright golden yellow
      subAccent: '#8e44ad', // Wild mountain berries
    },
    structure: {
      trunkPrimary: '#3e2723', // Weathered cedar
      trunkSecondary: '#5d4037',
      rockPrimary: '#6d6863',
      rockSecondary: '#857f79',
    },
    lighting: {
      ambientColor: '#ffe4c4',
      ambientIntensity: 0.8,
      sunColor: '#ffab40',
      sunIntensity: 1.55,
      sunPosition: [22, 28, 18],
      skyColor: '#fef3c7',
      fogColor: '#fed7aa',
      fogDensity: 0.007,
    },
    weather: {
      type: 'leaves',
      count: 150,
      speed: 1.35,
      size: 0.35,
      colors: ['#e65100', '#d84315', '#f57c00', '#fbc02d', '#b71c1c'],
      swayAmplitude: 1.1,
      swayFrequency: 2.2,
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
      darkModule: '#1e293b',
      lightModule: '#f8fafc',
      groundSlab: '#94a3b8',
      groundRim: '#64748b',
      finderDark: '#0f172a',
      finderLight: '#ffffff',
    },
    foliage: {
      primary: '#334e68', // Frosted evergreen teal
      secondary: '#486581', // Muted spruce
      accent: '#ffffff', // Pure fresh snowfall crowns
      subAccent: '#bae6fd', // Crystalline glacier blue
    },
    structure: {
      trunkPrimary: '#334155', // Silver birch / winter frost wood
      trunkSecondary: '#475569',
      rockPrimary: '#64748b',
      rockSecondary: '#94a3b8',
    },
    lighting: {
      ambientColor: '#e0f2fe',
      ambientIntensity: 0.8,
      sunColor: '#f8fafc',
      sunIntensity: 1.45,
      sunPosition: [16, 32, 22],
      skyColor: '#e2e8f0',
      fogColor: '#cbd5e1',
      fogDensity: 0.009,
    },
    weather: {
      type: 'snow',
      count: 240,
      speed: 0.95,
      size: 0.25,
      colors: ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd'],
      swayAmplitude: 0.5,
      swayFrequency: 1.0,
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
      darkModule: '#06b6d4', // Bright cyan laser
      lightModule: '#090d16', // Deep void obsidian
      groundSlab: '#0f172a', // Titanium alloy slab
      groundRim: '#ec4899', // Hot neon magenta bevel rim
      finderDark: '#00ffff', // Maximum contrast cyan
      finderLight: '#030712',
    },
    foliage: {
      primary: '#d946ef', // Neon fuchsia hologram
      secondary: '#06b6d4', // High-voltage cyan
      accent: '#facc15', // Electric yellow laser
      subAccent: '#8b5cf6', // Ultraviolet purple
    },
    structure: {
      trunkPrimary: '#1e1b4b', // Deep carbon composite
      trunkSecondary: '#312e81',
      rockPrimary: '#18181b', // Obsidian matte
      rockSecondary: '#27272a',
    },
    lighting: {
      ambientColor: '#2e1065',
      ambientIntensity: 0.95,
      sunColor: '#06b6d4',
      sunIntensity: 1.8,
      sunPosition: [16, 28, 20],
      skyColor: '#030712',
      fogColor: '#050a17',
      fogDensity: 0.012,
    },
    weather: {
      type: 'cyber-sparks',
      count: 200,
      speed: 1.7,
      size: 0.26,
      colors: ['#00f0ff', '#ff007f', '#a855f7', '#00ffaa'],
      swayAmplitude: 0.4,
      swayFrequency: 3.5,
      rising: true, // Sparks rise upwards
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
