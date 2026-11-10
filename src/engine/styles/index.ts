/**
 * SeasonQR - Styles Registry
 *
 * Exports all available 3D QR styles and provides helper resolution functions.
 */

export * from './types';
export * from './treeStyle';
export * from './islandStyle';
export * from './zenStyle';
export * from './photoStyle';

import type { QRStyleGenerator } from './types';
import { treeStyle } from './treeStyle';
import { islandStyle } from './islandStyle';
import { zenStyle } from './zenStyle';
import { photoStyle } from './photoStyle';

/**
 * Registry of all available 3D styles
 */
export const STYLES: Record<string, QRStyleGenerator> = {
  tree: treeStyle,
  island: islandStyle,
  zen: zenStyle,
  photo: photoStyle,
};

/**
 * List of available styles for UI selectors
 */
export const AVAILABLE_STYLES: QRStyleGenerator[] = [
  treeStyle,
  islandStyle,
  zenStyle,
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
