import { type ColorValue } from 'react-native';
import { ShapeJSXElement } from './Shape';
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
/**
 * Applies equal padding on all sides.
 * @param all - Padding value in dp.
 */
export declare const paddingAll: (all: number) => ModifierConfig;
/**
 * Applies padding with individual values for each side.
 * @param start - Left padding in dp (or right in RTL).
 * @param top - Top padding in dp.
 * @param end - Right padding in dp (or left in RTL).
 * @param bottom - Bottom padding in dp.
 */
export declare const padding: (start: number, top: number, end: number, bottom: number) => ModifierConfig;
/**
 * Sets exact width and height.
 * @param width - Width in dp.
 * @param height - Height in dp.
 */
export declare const size: (width: number, height: number) => ModifierConfig;
/**
 * Fills the maximum available size.
 * @param fraction - Fraction of max size (0.0 to 1.0). Default is 1.0.
 */
export declare const fillMaxSize: (fraction?: number) => ModifierConfig;
/**
 * Fills the maximum available width.
 * @param fraction - Fraction of max width (0.0 to 1.0). Default is 1.0.
 */
export declare const fillMaxWidth: (fraction?: number) => ModifierConfig;
/**
 * Fills the maximum available height.
 * @param fraction - Fraction of max height (0.0 to 1.0). Default is 1.0.
 */
export declare const fillMaxHeight: (fraction?: number) => ModifierConfig;
/**
 * Offsets the view from its natural position.
 * @param x - Horizontal offset in dp.
 * @param y - Vertical offset in dp.
 */
export declare const offset: (x: number, y: number) => ModifierConfig;
/**
 * Sets the background color.
 * @param color - Color string (hex, e.g., '#FF0000').
 */
export declare const background: (color: ColorValue) => ModifierConfig;
/**
 * Adds a border around the view.
 * @param borderWidth - Border width in dp.
 * @param borderColor - Border color string (hex).
 */
export declare const border: (borderWidth: number, borderColor: ColorValue) => ModifierConfig;
/**
 * Adds a shadow/elevation effect.
 * @param elevation - Shadow elevation in dp.
 */
export declare const shadow: (elevation: number) => ModifierConfig;
/**
 * Sets the opacity/alpha of the view.
 * @param alpha - Opacity value (0.0 to 1.0).
 */
export declare const alpha: (alpha: number) => ModifierConfig;
/**
 * Applies a blur effect.
 * @param radius - Blur radius in dp.
 */
export declare const blur: (radius: number) => ModifierConfig;
/**
 * Rotates the view.
 * @param degrees - Rotation angle in degrees.
 */
export declare const rotate: (degrees: number) => ModifierConfig;
/**
 * Sets the z-index for layering.
 * @param index - Z-index value.
 */
export declare const zIndex: (index: number) => ModifierConfig;
/**
 * Animates size changes with spring animation.
 * @param dampingRatio - Spring damping ratio. Default is DampingRatioNoBouncy.
 * @param stiffness - Spring stiffness. Default is StiffnessMedium.
 */
export declare const animateContentSize: (dampingRatio?: number, stiffness?: number) => ModifierConfig;
/**
 * Sets the weight for flexible sizing in Row or Column.
 * Only works when used inside Row or Column.
 * @param weight - Weight value (relative to siblings).
 */
export declare const weight: (weight: number) => ModifierConfig;
/**
 * Makes the view match the parent Box size.
 * Only works when used inside Box.
 */
export declare const matchParentSize: () => ModifierConfig;
/**
 * Makes the view clickable.
 * @param callback - Function to call when clicked.
 */
export declare const clickable: (callback: () => void) => ModifierConfig;
/**
 * Sets the test ID for testing frameworks.
 * @param tag - Test ID string.
 */
export declare const testID: (tag: string) => ModifierConfig;
/**
 * Clips the view to a shape.
 * @param shape - Shape JSX element to clip to.
 */
export declare const clip: (shape: ShapeJSXElement) => ModifierConfig;
//# sourceMappingURL=modifiers.d.ts.map