/**
 * SeasonQR - 3D Style Engine Extensibility Contracts
 *
 * Defines the core interfaces that every QR Style generator must implement.
 * Designed to make adding new 3D styles (e.g. Castle, Desert Oasis, Cyber Tower)
 * modular and effortless.
 */

import type * as THREE from 'three';
import type { QRMatrix } from '../qrParser';
import type { SeasonTheme } from '../seasons';

/**
 * Parameters passed to style generators
 */
export interface StyleGenerateParams {
  /** Parsed QR code matrix and seeded PRNG */
  matrix: QRMatrix;
  /** Active seasonal theme palette and configuration */
  season: SeasonTheme;
  /** Base QR width/length in Three.js world units (default: 24) */
  sceneSize?: number;
}

/**
 * Standard interface for any 3D SeasonQR style generator
 */
export interface QRStyleGenerator {
  /** Unique style identifier (e.g. 'tree', 'island', 'zen') */
  readonly id: string;
  /** English display name */
  readonly name: string;
  /** Vietnamese display name */
  readonly vietnameseName: string;
  /** Emoji or icon descriptor */
  readonly icon: string;
  /** English description */
  readonly description: string;
  /** Vietnamese description */
  readonly vietnameseDescription: string;

  /**
   * Generates and returns a self-contained THREE.Group containing the 3D scene:
   * QR base plate + seasonal scenery + props.
   */
  generate(params: StyleGenerateParams): THREE.Group;
}
