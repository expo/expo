/**
 * Copyright (c) Expo.
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ColorValue, processColor } from 'react-native';

const isWebColor = (color: string): boolean =>
  color === 'currentcolor' ||
  color === 'currentColor' ||
  color === 'inherit' ||
  color.indexOf('var(') === 0;

export function normalizeColor(color?: ColorValue, opacity: number = 1): void | string {
  if (color == null) return;

  if (typeof color === 'string' && isWebColor(color)) {
    return color;
  }

  const colorInt = processColor(color);
  if (typeof colorInt === 'number') {
    const r = (colorInt >> 16) & 255;
    const g = (colorInt >> 8) & 255;
    const b = colorInt & 255;
    const a = ((colorInt >> 24) & 255) / 255;
    const alpha = (a * opacity).toFixed(2);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
