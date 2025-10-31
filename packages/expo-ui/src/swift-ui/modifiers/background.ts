import { createModifier } from './createModifier';
import type { Color } from './types';
import type { Shape } from './shapes/index';

/**
 * Sets the background of a view.
 * @param color - The background color (hex string). For example, `#FF0000`.
 * @param shape - Optional shape to clip the background. If not provided, the background will fill the entire view.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/background(_:alignment:)).
 */
export const background = (color: Color, shape?: Shape) =>
  createModifier('background', { color, ...shape });
