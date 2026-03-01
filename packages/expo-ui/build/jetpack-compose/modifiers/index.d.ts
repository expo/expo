import { type ColorValue } from 'react-native';
export { type ExpoModifier } from '../../types';
export type Alignment = 'topStart' | 'topCenter' | 'topEnd' | 'centerStart' | 'center' | 'centerEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd' | 'top' | 'centerVertically' | 'bottom' | 'start' | 'centerHorizontally' | 'end';
/**
 * Applies equal padding on all sides.
 * @param all - Padding value in dp.
 */
export declare const paddingAll: (all: number) => import("./createModifier").ModifierConfig;
/**
 * Applies padding with individual values for each side.
 * @param start - Left padding in dp (or right in RTL).
 * @param top - Top padding in dp.
 * @param end - Right padding in dp (or left in RTL).
 * @param bottom - Bottom padding in dp.
 */
export declare const padding: (start: number, top: number, end: number, bottom: number) => import("./createModifier").ModifierConfig;
/**
 * Sets exact width and height.
 * @param width - Width in dp.
 * @param height - Height in dp.
 */
export declare const size: (width: number, height: number) => import("./createModifier").ModifierConfig;
/**
 * Fills the maximum available size.
 * @param fraction - Fraction of max size (0.0 to 1.0). Default is 1.0.
 */
export declare const fillMaxSize: (fraction?: number) => import("./createModifier").ModifierConfig;
/**
 * Fills the maximum available width.
 * @param fraction - Fraction of max width (0.0 to 1.0). Default is 1.0.
 */
export declare const fillMaxWidth: (fraction?: number) => import("./createModifier").ModifierConfig;
/**
 * Fills the maximum available height.
 * @param fraction - Fraction of max height (0.0 to 1.0). Default is 1.0.
 */
export declare const fillMaxHeight: (fraction?: number) => import("./createModifier").ModifierConfig;
/**
 * Sets the exact width of the view.
 * @param value - Width in dp.
 */
export declare const width: (value: number) => import("./createModifier").ModifierConfig;
/**
 * Sets the exact height of the view.
 * @param value - Height in dp.
 */
export declare const height: (value: number) => import("./createModifier").ModifierConfig;
/**
 * Wraps the width to the content size.
 * @param alignment - Optional horizontal alignment ('start', 'centerHorizontally', 'end').
 */
export declare const wrapContentWidth: (alignment?: "start" | "centerHorizontally" | "end") => import("./createModifier").ModifierConfig;
/**
 * Wraps the height to the content size.
 * @param alignment - Optional vertical alignment ('top', 'centerVertically', 'bottom').
 */
export declare const wrapContentHeight: (alignment?: "top" | "centerVertically" | "bottom") => import("./createModifier").ModifierConfig;
/**
 * Offsets the view from its natural position.
 * @param x - Horizontal offset in dp.
 * @param y - Vertical offset in dp.
 */
export declare const offset: (x: number, y: number) => import("./createModifier").ModifierConfig;
/**
 * Sets the background color.
 * @param color - Color string (hex, e.g., '#FF0000').
 */
export declare const background: (color: ColorValue) => import("./createModifier").ModifierConfig;
/**
 * Adds a border around the view.
 * @param borderWidth - Border width in dp.
 * @param borderColor - Border color string (hex).
 */
export declare const border: (borderWidth: number, borderColor: ColorValue) => import("./createModifier").ModifierConfig;
/**
 * Adds a shadow/elevation effect.
 * @param elevation - Shadow elevation in dp.
 */
export declare const shadow: (elevation: number) => import("./createModifier").ModifierConfig;
/**
 * Sets the opacity/alpha of the view.
 * @param alpha - Opacity value (0.0 to 1.0).
 */
export declare const alpha: (alpha: number) => import("./createModifier").ModifierConfig;
/**
 * Applies a blur effect.
 * @param radius - Blur radius in dp.
 */
export declare const blur: (radius: number) => import("./createModifier").ModifierConfig;
/**
 * Rotates the view.
 * @param degrees - Rotation angle in degrees.
 */
export declare const rotate: (degrees: number) => import("./createModifier").ModifierConfig;
/**
 * Sets the z-index for layering.
 * @param index - Z-index value.
 */
export declare const zIndex: (index: number) => import("./createModifier").ModifierConfig;
/**
 * Animates size changes with spring animation.
 * @param dampingRatio - Spring damping ratio. Default is DampingRatioNoBouncy.
 * @param stiffness - Spring stiffness. Default is StiffnessMedium.
 */
export declare const animateContentSize: (dampingRatio?: number, stiffness?: number) => import("./createModifier").ModifierConfig;
/**
 * Sets the weight for flexible sizing in Row or Column.
 * Only works when used inside Row or Column.
 * @param weight - Weight value (relative to siblings).
 */
export declare const weight: (weight: number) => import("./createModifier").ModifierConfig;
/**
 * Aligns the view within its container.
 */
export declare const align: (alignment: Alignment) => import("./createModifier").ModifierConfig;
/**
 * Makes the view match the parent Box size.
 * Only works when used inside Box.
 */
export declare const matchParentSize: () => import("./createModifier").ModifierConfig;
/**
 * Makes the view clickable.
 * @param handler - Function to call when clicked.
 */
export declare const clickable: (handler: () => void) => import("./createModifier").ModifierConfig;
/**
 * Makes the view selectable, like a radio button row.
 * @param selected - Whether the item is currently selected.
 * @param handler - Function to call when the item is clicked.
 */
export declare const selectable: (selected: boolean, handler: () => void) => import("./createModifier").ModifierConfig;
/**
 * Sets the test ID for testing frameworks.
 * @param tag - Test ID string.
 */
export declare const testID: (tag: string) => import("./createModifier").ModifierConfig;
type MaterialShapeName = 'cookie4Sided' | 'cookie6Sided' | 'cookie7Sided' | 'cookie9Sided' | 'cookie12Sided' | 'clover4Leaf' | 'clover8Leaf' | 'softBurst' | 'boom' | 'oval' | 'pill' | 'triangle' | 'diamond' | 'pentagon' | 'sunny' | 'verySunny' | 'fan' | 'pixelCircle' | 'pixelTriangle' | 'ghostish' | 'bun' | 'heart' | 'arch' | 'slanted' | 'puffy' | 'puffyDiamond';
type CornerRadii = {
    topStart?: number;
    topEnd?: number;
    bottomStart?: number;
    bottomEnd?: number;
};
/**
 * Built-in Jetpack Compose shape for the clip modifier.
 */
export type BuiltinShape = {
    type: 'rectangle';
} | {
    type: 'circle';
} | {
    type: 'roundedCorner';
    radius?: number;
    topStart?: number;
    topEnd?: number;
    bottomStart?: number;
    bottomEnd?: number;
} | {
    type: 'cutCorner';
    radius?: number;
    topStart?: number;
    topEnd?: number;
    bottomStart?: number;
    bottomEnd?: number;
} | {
    type: 'material';
    name: MaterialShapeName;
};
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
export declare const Shapes: {
    Rectangle: BuiltinShape;
    Circle: BuiltinShape;
    RoundedCorner: (params: number | CornerRadii) => BuiltinShape;
    CutCorner: (params: number | CornerRadii) => BuiltinShape;
    Material: {
        Cookie4Sided: BuiltinShape;
        Cookie6Sided: BuiltinShape;
        Cookie7Sided: BuiltinShape;
        Cookie9Sided: BuiltinShape;
        Cookie12Sided: BuiltinShape;
        Clover4Leaf: BuiltinShape;
        Clover8Leaf: BuiltinShape;
        SoftBurst: BuiltinShape;
        Boom: BuiltinShape;
        Oval: BuiltinShape;
        Pill: BuiltinShape;
        Triangle: BuiltinShape;
        Diamond: BuiltinShape;
        Pentagon: BuiltinShape;
        Sunny: BuiltinShape;
        VerySunny: BuiltinShape;
        Fan: BuiltinShape;
        PixelCircle: BuiltinShape;
        PixelTriangle: BuiltinShape;
        Ghostish: BuiltinShape;
        Bun: BuiltinShape;
        Heart: BuiltinShape;
        Arch: BuiltinShape;
        Slanted: BuiltinShape;
        Puffy: BuiltinShape;
        PuffyDiamond: BuiltinShape;
    };
};
/**
 * Clips the view to a built-in Jetpack Compose shape.
 * @param shape - A shape from `Shapes`, e.g. `Shapes.Circle` or `Shapes.Material.Heart`.
 */
export declare const clip: (shape: BuiltinShape) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=index.d.ts.map