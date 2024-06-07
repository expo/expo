// @ts-expect-error: normalize-colors does not export types
import type normalizeColorType from '@react-native/normalize-colors';
import path from 'path';
import resolveFrom from 'resolve-from';

let normalizeColor: typeof normalizeColorType | null = null;

/**
 * Convert a color string to an integer.
 * @param projectRoot The project root directory.
 * @param color The color string to convert, e.g. '#ff0000', 'red', 'rgba(255, 0, 0, 1)'.
 */
export function convertColor(projectRoot: string, color: string): number {
  if (!normalizeColor) {
    const normalizeColorPath = resolveNormalizeColor(projectRoot);
    if (!normalizeColorPath) {
      throw new Error('Unable to resolve the @react-native/normalize-colors package');
    }
    normalizeColor = require(normalizeColorPath);
  }

  const colorInt = normalizeColor(color);
  if (!colorInt) {
    throw new Error(`Invalid color value: ${color}`);
  }
  return ((colorInt << 24) | (colorInt >>> 8)) >>> 0;
}

function resolveNormalizeColor(projectRoot: string): string | null {
  const reactNativePackageJsonPath = resolveFrom.silent(projectRoot, 'react-native/package.json');
  if (reactNativePackageJsonPath) {
    const reactNativeDir = path.dirname(reactNativePackageJsonPath);
    const normalizeColorPath = resolveFrom.silent(reactNativeDir, '@react-native/normalize-colors');
    if (normalizeColorPath) {
      return normalizeColorPath;
    }
  }
  return null;
}
