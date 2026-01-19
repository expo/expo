import { type ColorValue } from 'react-native';

import { parseJSXShape, ShapeJSXElement } from './Shape';

/**
 * Modifier configuration for Jetpack Compose views.
 * This follows the JSON Config pattern (same as iOS SwiftUI modifiers).
 *
 * @example
 * ```tsx
 * import { Button, paddingAll, background } from 'expo-ui';
 *
 * <Button modifiers={[paddingAll(10), background('#FF0000')]} />
 * ```
 */
export interface ModifierConfig {
  $type: string;
  $scope?: string;
  [key: string]: unknown;
}

// =============================================================================
// Padding Modifiers
// =============================================================================

/**
 * Applies equal padding on all sides.
 * @param all - Padding value in dp.
 */
export const paddingAll = (all: number): ModifierConfig => ({ $type: 'paddingAll', all });

/**
 * Applies padding with individual values for each side.
 * @param start - Left padding in dp (or right in RTL).
 * @param top - Top padding in dp.
 * @param end - Right padding in dp (or left in RTL).
 * @param bottom - Bottom padding in dp.
 */
export const padding = (
  start: number,
  top: number,
  end: number,
  bottom: number
): ModifierConfig => ({ $type: 'padding', start, top, end, bottom });

// =============================================================================
// Size Modifiers
// =============================================================================

/**
 * Sets exact width and height.
 * @param width - Width in dp.
 * @param height - Height in dp.
 */
export const size = (width: number, height: number): ModifierConfig => ({
  $type: 'size',
  width,
  height,
});

/**
 * Fills the maximum available size.
 * @param fraction - Fraction of max size (0.0 to 1.0). Default is 1.0.
 */
export const fillMaxSize = (fraction?: number): ModifierConfig => ({
  $type: 'fillMaxSize',
  fraction,
});

/**
 * Fills the maximum available width.
 * @param fraction - Fraction of max width (0.0 to 1.0). Default is 1.0.
 */
export const fillMaxWidth = (fraction?: number): ModifierConfig => ({
  $type: 'fillMaxWidth',
  fraction,
});

/**
 * Fills the maximum available height.
 * @param fraction - Fraction of max height (0.0 to 1.0). Default is 1.0.
 */
export const fillMaxHeight = (fraction?: number): ModifierConfig => ({
  $type: 'fillMaxHeight',
  fraction,
});

// =============================================================================
// Position Modifiers
// =============================================================================

/**
 * Offsets the view from its natural position.
 * @param x - Horizontal offset in dp.
 * @param y - Vertical offset in dp.
 */
export const offset = (x: number, y: number): ModifierConfig => ({ $type: 'offset', x, y });

// =============================================================================
// Appearance Modifiers
// =============================================================================

/**
 * Sets the background color.
 * @param color - Color string (hex, e.g., '#FF0000').
 */
export const background = (color: ColorValue): ModifierConfig => ({ $type: 'background', color });

/**
 * Adds a border around the view.
 * @param borderWidth - Border width in dp.
 * @param borderColor - Border color string (hex).
 */
export const border = (borderWidth: number, borderColor: ColorValue): ModifierConfig => ({
  $type: 'border',
  borderWidth,
  borderColor,
});

/**
 * Adds a shadow/elevation effect.
 * @param elevation - Shadow elevation in dp.
 */
export const shadow = (elevation: number): ModifierConfig => ({ $type: 'shadow', elevation });

/**
 * Sets the opacity/alpha of the view.
 * @param alpha - Opacity value (0.0 to 1.0).
 */
export const alpha = (alpha: number): ModifierConfig => ({ $type: 'alpha', alpha });

/**
 * Applies a blur effect.
 * @param radius - Blur radius in dp.
 */
export const blur = (radius: number): ModifierConfig => ({ $type: 'blur', radius });

// =============================================================================
// Transform Modifiers
// =============================================================================

/**
 * Rotates the view.
 * @param degrees - Rotation angle in degrees.
 */
export const rotate = (degrees: number): ModifierConfig => ({ $type: 'rotate', degrees });

/**
 * Sets the z-index for layering.
 * @param index - Z-index value.
 */
export const zIndex = (index: number): ModifierConfig => ({ $type: 'zIndex', index });

// =============================================================================
// Animation Modifiers
// =============================================================================

/**
 * Animates size changes with spring animation.
 * @param dampingRatio - Spring damping ratio. Default is DampingRatioNoBouncy.
 * @param stiffness - Spring stiffness. Default is StiffnessMedium.
 */
export const animateContentSize = (dampingRatio?: number, stiffness?: number): ModifierConfig => ({
  $type: 'animateContentSize',
  dampingRatio,
  stiffness,
});

// =============================================================================
// Scope-dependent Modifiers
// =============================================================================

/**
 * Sets the weight for flexible sizing in Row or Column.
 * Only works when used inside Row or Column.
 * @param weight - Weight value (relative to siblings).
 */
export const weight = (weight: number): ModifierConfig => ({
  $type: 'weight',
  $scope: 'RowScope',
  weight,
});

/**
 * Makes the view match the parent Box size.
 * Only works when used inside Box.
 */
export const matchParentSize = (): ModifierConfig => ({
  $type: 'matchParentSize',
  $scope: 'BoxScope',
});

// =============================================================================
// Interaction Modifiers
// =============================================================================

/**
 * Makes the view clickable.
 * @param callback - Function to call when clicked.
 */
export const clickable = (callback: () => void): ModifierConfig => ({
  $type: 'clickable',
  eventListener: callback,
});

// =============================================================================
// Utility Modifiers
// =============================================================================

/**
 * Sets the test ID for testing frameworks.
 * @param tag - Test ID string.
 */
export const testID = (tag: string): ModifierConfig => ({ $type: 'testID', testID: tag });

/**
 * Clips the view to a shape.
 * @param shape - Shape JSX element to clip to.
 */
export const clip = (shape: ShapeJSXElement): ModifierConfig => ({
  $type: 'clip',
  shape: parseJSXShape(shape),
});
