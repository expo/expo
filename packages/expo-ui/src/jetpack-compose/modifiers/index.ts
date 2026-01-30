import { type ColorValue } from 'react-native';

import { createModifier, createModifierWithEventListener } from './createModifier';
export { type ExpoModifier } from '../../types';

export type Alignment =
  // 2D Alignments
  | 'topStart'
  | 'topCenter'
  | 'topEnd'
  | 'centerStart'
  | 'center'
  | 'centerEnd'
  | 'bottomStart'
  | 'bottomCenter'
  | 'bottomEnd'
  // 1D Alignments Vertically
  | 'top'
  | 'centerVertically'
  | 'bottom'
  // 1D Alignments Horizontally
  | 'start'
  | 'centerHorizontally'
  | 'end';

/**
 * Applies equal padding on all sides.
 * @param all - Padding value in dp.
 */
export const paddingAll = (all: number) => createModifier('paddingAll', { all });

/**
 * Applies padding with individual values for each side.
 * @param start - Left padding in dp (or right in RTL).
 * @param top - Top padding in dp.
 * @param end - Right padding in dp (or left in RTL).
 * @param bottom - Bottom padding in dp.
 */
export const padding = (start: number, top: number, end: number, bottom: number) =>
  createModifier('padding', { start, top, end, bottom });

// =============================================================================
// Size Modifiers
// =============================================================================

/**
 * Sets exact width and height.
 * @param width - Width in dp.
 * @param height - Height in dp.
 */
export const size = (width: number, height: number) => createModifier('size', { width, height });

/**
 * Fills the maximum available size.
 * @param fraction - Fraction of max size (0.0 to 1.0). Default is 1.0.
 */
export const fillMaxSize = (fraction?: number) => createModifier('fillMaxSize', { fraction });

/**
 * Fills the maximum available width.
 * @param fraction - Fraction of max width (0.0 to 1.0). Default is 1.0.
 */
export const fillMaxWidth = (fraction?: number) => createModifier('fillMaxWidth', { fraction });

/**
 * Fills the maximum available height.
 * @param fraction - Fraction of max height (0.0 to 1.0). Default is 1.0.
 */
export const fillMaxHeight = (fraction?: number) => createModifier('fillMaxHeight', { fraction });

/**
 * Sets the exact width of the view.
 * @param value - Width in dp.
 */
export const width = (value: number) => createModifier('width', { width: value });

/**
 * Sets the exact height of the view.
 * @param value - Height in dp.
 */
export const height = (value: number) => createModifier('height', { height: value });

/**
 * Wraps the width to the content size.
 * @param alignment - Optional horizontal alignment ('start', 'centerHorizontally', 'end').
 */
export const wrapContentWidth = (alignment?: 'start' | 'centerHorizontally' | 'end') =>
  createModifier('wrapContentWidth', alignment ? { alignment } : {});

/**
 * Wraps the height to the content size.
 * @param alignment - Optional vertical alignment ('top', 'centerVertically', 'bottom').
 */
export const wrapContentHeight = (alignment?: 'top' | 'centerVertically' | 'bottom') =>
  createModifier('wrapContentHeight', alignment ? { alignment } : {});

// =============================================================================
// Position Modifiers
// =============================================================================

/**
 * Offsets the view from its natural position.
 * @param x - Horizontal offset in dp.
 * @param y - Vertical offset in dp.
 */
export const offset = (x: number, y: number) => createModifier('offset', { x, y });

// =============================================================================
// Appearance Modifiers
// =============================================================================

/**
 * Sets the background color.
 * @param color - Color string (hex, e.g., '#FF0000').
 */
export const background = (color: ColorValue) => createModifier('background', { color });

/**
 * Adds a border around the view.
 * @param borderWidth - Border width in dp.
 * @param borderColor - Border color string (hex).
 */
export const border = (borderWidth: number, borderColor: ColorValue) =>
  createModifier('border', { borderWidth, borderColor });

/**
 * Adds a shadow/elevation effect.
 * @param elevation - Shadow elevation in dp.
 */
export const shadow = (elevation: number) => createModifier('shadow', { elevation });

/**
 * Sets the opacity/alpha of the view.
 * @param alpha - Opacity value (0.0 to 1.0).
 */
export const alpha = (alpha: number) => createModifier('alpha', { alpha });

/**
 * Applies a blur effect.
 * @param radius - Blur radius in dp.
 */
export const blur = (radius: number) => createModifier('blur', { radius });

// =============================================================================
// Transform Modifiers
// =============================================================================

/**
 * Rotates the view.
 * @param degrees - Rotation angle in degrees.
 */
export const rotate = (degrees: number) => createModifier('rotate', { degrees });

/**
 * Sets the z-index for layering.
 * @param index - Z-index value.
 */
export const zIndex = (index: number) => createModifier('zIndex', { index });

// =============================================================================
// Animation Modifiers
// =============================================================================

/**
 * Animates size changes with spring animation.
 * @param dampingRatio - Spring damping ratio. Default is DampingRatioNoBouncy.
 * @param stiffness - Spring stiffness. Default is StiffnessMedium.
 */
export const animateContentSize = (dampingRatio?: number, stiffness?: number) =>
  createModifier('animateContentSize', { dampingRatio, stiffness });

// =============================================================================
// Scope-dependent Modifiers
// =============================================================================

/**
 * Sets the weight for flexible sizing in Row or Column.
 * Only works when used inside Row or Column.
 * @param weight - Weight value (relative to siblings).
 */
export const weight = (weight: number) => createModifier('weight', { weight });

/**
 * Aligns the view within its container.
 */
export const align = (alignment: Alignment) => createModifier('align', { alignment });

/**
 * Makes the view match the parent Box size.
 * Only works when used inside Box.
 */
export const matchParentSize = () => createModifier('matchParentSize');

// =============================================================================
// Interaction Modifiers
// =============================================================================

/**
 * Makes the view clickable.
 * @param handler - Function to call when clicked.
 */
export const clickable = (handler: () => void) =>
  createModifierWithEventListener('clickable', handler);

/**
 * Makes the view selectable, like a radio button row.
 * @param selected - Whether the item is currently selected.
 * @param handler - Function to call when the item is clicked.
 */
export const selectable = (selected: boolean, handler: () => void) =>
  createModifierWithEventListener('selectable', handler, { selected });

// =============================================================================
// Utility Modifiers
// =============================================================================

/**
 * Sets the test ID for testing frameworks.
 * @param tag - Test ID string.
 */
export const testID = (tag: string) => createModifier('testID', { testID: tag });

// =============================================================================
// Clip Modifier & Shapes
// =============================================================================

type MaterialShapeName =
  | 'cookie4Sided'
  | 'cookie6Sided'
  | 'cookie7Sided'
  | 'cookie9Sided'
  | 'cookie12Sided'
  | 'clover4Leaf'
  | 'clover8Leaf'
  | 'softBurst'
  | 'boom'
  | 'oval'
  | 'pill'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'sunny'
  | 'verySunny'
  | 'fan'
  | 'pixelCircle'
  | 'pixelTriangle'
  | 'ghostish'
  | 'bun'
  | 'heart'
  | 'arch'
  | 'slanted'
  | 'puffy'
  | 'puffyDiamond';

type CornerRadii = {
  topStart?: number;
  topEnd?: number;
  bottomStart?: number;
  bottomEnd?: number;
};

/**
 * Built-in Jetpack Compose shape for the clip modifier.
 */
export type BuiltinShape =
  | { type: 'rectangle' }
  | { type: 'circle' }
  | {
      type: 'roundedCorner';
      radius?: number;
      topStart?: number;
      topEnd?: number;
      bottomStart?: number;
      bottomEnd?: number;
    }
  | {
      type: 'cutCorner';
      radius?: number;
      topStart?: number;
      topEnd?: number;
      bottomStart?: number;
      bottomEnd?: number;
    }
  | { type: 'material'; name: MaterialShapeName };

const material = (name: MaterialShapeName): BuiltinShape => ({ type: 'material', name });

/**
 * Predefined shapes for use with the `clip` modifier.
 *
 * @example
 * ```tsx
 * clip(Shapes.Circle)
 * clip(Shapes.RoundedCorner(16))
 * clip(Shapes.RoundedCorner({ topStart: 8, bottomEnd: 16 }))
 * clip(Shapes.Material.Heart)
 * ```
 */
export const Shapes = {
  Rectangle: { type: 'rectangle' } as BuiltinShape,
  Circle: { type: 'circle' } as BuiltinShape,
  RoundedCorner: (params: number | CornerRadii): BuiltinShape =>
    typeof params === 'number'
      ? { type: 'roundedCorner', radius: params }
      : { type: 'roundedCorner', ...params },
  CutCorner: (params: number | CornerRadii): BuiltinShape =>
    typeof params === 'number'
      ? { type: 'cutCorner', radius: params }
      : { type: 'cutCorner', ...params },
  Material: {
    Cookie4Sided: material('cookie4Sided'),
    Cookie6Sided: material('cookie6Sided'),
    Cookie7Sided: material('cookie7Sided'),
    Cookie9Sided: material('cookie9Sided'),
    Cookie12Sided: material('cookie12Sided'),
    Clover4Leaf: material('clover4Leaf'),
    Clover8Leaf: material('clover8Leaf'),
    SoftBurst: material('softBurst'),
    Boom: material('boom'),
    Oval: material('oval'),
    Pill: material('pill'),
    Triangle: material('triangle'),
    Diamond: material('diamond'),
    Pentagon: material('pentagon'),
    Sunny: material('sunny'),
    VerySunny: material('verySunny'),
    Fan: material('fan'),
    PixelCircle: material('pixelCircle'),
    PixelTriangle: material('pixelTriangle'),
    Ghostish: material('ghostish'),
    Bun: material('bun'),
    Heart: material('heart'),
    Arch: material('arch'),
    Slanted: material('slanted'),
    Puffy: material('puffy'),
    PuffyDiamond: material('puffyDiamond'),
  },
};

/**
 * Clips the view to a built-in Jetpack Compose shape.
 * @param shape - A shape from `Shapes`, e.g. `Shapes.Circle` or `Shapes.Material.Heart`.
 */
export const clip = (shape: BuiltinShape) => createModifier('clip', { shape });
