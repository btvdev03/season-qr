/**
 * SeasonQR - QR Code Parser & Seed Generator
 *
 * Generates QR code module matrix with Error Correction Level 'H' (30% recovery),
 * identifies finder pattern safety zones, and derives a deterministic 32-bit PRNG seed
 * so the exact same URL always produces the exact same procedural 3D scenery.
 */

import QRCode from 'qrcode';

/**
 * 32-bit FNV-1a non-cryptographic hash algorithm.
 * Extremely fast, excellent avalanche characteristics, perfect for seeding PRNG.
 */
export function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * High-performance deterministic Pseudo-Random Number Generator using Mulberry32.
 * Erases any dependency on Math.random for guaranteed reproducible 3D scenes.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    // Ensure 32-bit unsigned non-zero initial state
    this.state = (seed >>> 0) || 0x12345678;
  }

  /**
   * Generates next pseudo-random float in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates pseudo-random float in [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates pseudo-random integer in [min, max] inclusive
   */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Picks a random element from an array
   */
  choice<T>(items: readonly T[] | T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return items[Math.floor(this.next() * items.length)];
  }

  /**
   * Returns true with the given probability (0..1)
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Returns random angle in radians [0, 2*PI)
   */
  angle(): number {
    return this.next() * Math.PI * 2;
  }
}

/**
 * Creates a new seeded PRNG instance
 */
export function seededRandom(seed: number): SeededRNG {
  return new SeededRNG(seed);
}

/**
 * Determines whether a cell is within one of the three 7x7 corner finder patterns:
 * - Top-Left: row < 7 && col < 7
 * - Top-Right: row < 7 && col >= size - 7
 * - Bottom-Left: row >= size - 7 && col < 7
 */
export function isFinderPattern(row: number, col: number, size: number): boolean {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= size - 7;
  const inBottomLeft = row >= size - 7 && col < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

/**
 * Determines whether a cell is part of the 1-module quiet separator ring
 * surrounding the three finder patterns (8x8 boundary area excluding the 7x7 core).
 */
export function isFinderSeparator(row: number, col: number, size: number): boolean {
  const inTopLeftSep = row <= 7 && col <= 7 && !(row < 7 && col < 7);
  const inTopRightSep =
    row <= 7 && col >= size - 8 && !(row < 7 && col >= size - 7);
  const inBottomLeftSep =
    row >= size - 8 && col <= 7 && !(row >= size - 7 && col < 7);
  return inTopLeftSep || inTopRightSep || inBottomLeftSep;
}

/**
 * Combined check: cell is in either finder pattern core or its separator margin (8x8 box in 3 corners).
 * MUST NEVER be blocked, obscured, or decorated by 3D props.
 */
export function isFinderOrSeparator(row: number, col: number, size: number): boolean {
  return isFinderPattern(row, col, size) || isFinderSeparator(row, col, size);
}

/**
 * Checks whether a module is in the center region of the QR code.
 * Useful for anchoring the central tree trunk or main feature in safe error-corrected modules.
 */
export function isCenterRegion(
  row: number,
  col: number,
  size: number,
  radiusModules: number = 3
): boolean {
  const mid = (size - 1) / 2;
  const dr = row - mid;
  const dc = col - mid;
  return dr * dr + dc * dc <= radiusModules * radiusModules;
}

/**
 * Parsed QR Code data structure with analytical safety helpers
 */
export interface QRMatrix {
  /** Dimension N of the N x N module matrix (e.g. 21, 25, 29, 33) */
  size: number;
  /** 2D matrix of modules: true = dark module, false = light module */
  matrix: boolean[][];
  /** Checks if module is inside a 7x7 finder pattern */
  isFinder: (row: number, col: number) => boolean;
  /** Checks if module is inside the 8x8 finder pattern + separator zone */
  isReserved: (row: number, col: number) => boolean;
  /** Checks if module is in the center anchor area */
  isCenter: (row: number, col: number, radius?: number) => boolean;
  /** 32-bit deterministic seed derived from raw input URL */
  seed: number;
  /** Seeded PRNG ready for procedural generation */
  rng: SeededRNG;
  /** Original input URL/text string */
  rawText: string;
  /** QR Version (1..40) */
  version: number;
}

/**
 * Parses any URL or text into a QRMatrix with Error Correction Level 'H'
 * and sets up deterministic seeded PRNG.
 */
export function parseQRCode(text: string): QRMatrix {
  const trimmed = text.trim() || 'https://github.com';
  const qr = QRCode.create(trimmed, { errorCorrectionLevel: 'H' });
  const size = qr.modules.size;

  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(qr.modules.get(r, c) === 1);
    }
    matrix.push(row);
  }

  const seed = fnv1a(trimmed);
  const rng = seededRandom(seed);

  return {
    size,
    matrix,
    isFinder: (row: number, col: number) => isFinderPattern(row, col, size),
    isReserved: (row: number, col: number) => isFinderOrSeparator(row, col, size),
    isCenter: (row: number, col: number, radius = 3) =>
      isCenterRegion(row, col, size, radius),
    seed,
    rng,
    rawText: trimmed,
    version: qr.version,
  };
}
