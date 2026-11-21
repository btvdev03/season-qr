/**
 * SeasonQR - Styles Registry
 *
 * Exports all available 3D QR styles and provides helper resolution functions.
 */

export * from './types';
export * from './treeStyle';
export * from './cyberStyle';
export * from './zenStyle';
export * from './islandStyle';
export * from './crystalStyle';
export * from './brickStyle';
export * from './photoStyle';

import type { QRStyleGenerator } from './types';
import { treeStyle } from './treeStyle';
import { cyberStyle } from './cyberStyle';
import { zenStyle } from './zenStyle';
import { islandStyle } from './islandStyle';
import { crystalStyle } from './crystalStyle';
import { brickStyle } from './brickStyle';
import { photoStyle } from './photoStyle';

/**
 * Registry of all available 3D styles
 */
export const STYLES: Record<string, QRStyleGenerator> = {
  tree: treeStyle,
  cyber: cyberStyle,
  zen: zenStyle,
  island: islandStyle,
  crystal: crystalStyle,
  brick: brickStyle,
  photo: photoStyle,
};

/**
 * List of available styles for UI selectors
 */
export const AVAILABLE_STYLES: QRStyleGenerator[] = [
  treeStyle,
  cyberStyle,
  zenStyle,
  islandStyle,
  crystalStyle,
  brickStyle,
  photoStyle,
];

/**
 * Default fallback style
 */
export const DEFAULT_STYLE: QRStyleGenerator = treeStyle;

/**
 * Resolves a style generator by ID, falling back to treeStyle if not found.
 */
export function getStyle(id: string): QRStyleGenerator {
  return STYLES[id] ?? DEFAULT_STYLE;
}
