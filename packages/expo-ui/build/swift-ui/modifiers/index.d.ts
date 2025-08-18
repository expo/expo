/**
 * Core modifier factory and type definitions for SwiftUI view modifiers.
 * This system allows both built-in and 3rd party modifiers to use the same API.
 */
/**
 * Base interface for all view modifiers.
 * All modifiers must have a type field and can include arbitrary parameters.
 */
export interface ModifierConfig {
    $type: string;
    [key: string]: any;
    eventListener?: (args: any) => void;
}
/**
 * Factory function to create modifier configuration objects.
 * This is used internally by all modifier functions.
 */
declare function createModifier(type: string, params?: Record<string, any>): ModifierConfig;
/**
 * Sets the background of a view.
 * @param color - The background color (hex string, e.g., '#FF0000')
 */
export declare const background: (color: string) => ModifierConfig;
/**
 * Applies corner radius to a view.
 * @param radius - The corner radius value
 */
export declare const cornerRadius: (radius: number) => ModifierConfig;
/**
 * Adds a shadow to a view.
 */
export declare const shadow: (params: {
    radius: number;
    x?: number;
    y?: number;
    color?: string;
}) => ModifierConfig;
/**
 * Sets the frame properties of a view.
 */
export declare const frame: (params: {
    width?: number;
    height?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    idealWidth?: number;
    idealHeight?: number;
    alignment?: "center" | "leading" | "trailing" | "top" | "bottom" | "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing";
}) => ModifierConfig;
/**
 * Sets padding on a view.
 * Supports individual edges or shorthand properties.
 */
export declare const padding: (params: {
    top?: number;
    bottom?: number;
    leading?: number;
    trailing?: number;
    horizontal?: number;
    vertical?: number;
    all?: number;
}) => ModifierConfig;
/**
 * Controls fixed size behavior.
 * @param enabled - Whether the view should use its natural size
 */
export declare const fixedSize: (enabled?: boolean) => ModifierConfig;
/**
 * Adds a tap gesture recognizer.
 * @param handler - Function to call when tapped
 */
export declare const onTapGesture: (handler: () => void) => ModifierConfig;
/**
 * Adds a long press gesture recognizer.
 * @param handler - Function to call when long pressed
 * @param minimumDuration - Minimum duration for long press (default: 0.5s)
 */
export declare const onLongPressGesture: (handler: () => void, minimumDuration?: number) => ModifierConfig;
/**
 * Sets the opacity of a view.
 * @param value - Opacity value between 0 and 1
 */
export declare const opacity: (value: number) => ModifierConfig;
/**
 * Clips the view to a specific shape.
 * @param shape - The clipping shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 */
export declare const clipShape: (shape: "rectangle" | "circle" | "roundedRectangle", cornerRadius?: number) => ModifierConfig;
/**
 * Adds a border to a view.
 */
export declare const border: (params: {
    color: string;
    width?: number;
}) => ModifierConfig;
/**
 * Applies scaling transformation.
 * @param scale - Scale factor (1.0 = normal size)
 */
export declare const scaleEffect: (scale: number) => ModifierConfig;
/**
 * Applies rotation transformation.
 * @param angle - Rotation angle in degrees
 */
export declare const rotationEffect: (angle: number) => ModifierConfig;
/**
 * Applies an offset (translation) to a view.
 */
export declare const offset: (params: {
    x?: number;
    y?: number;
}) => ModifierConfig;
/**
 * Sets the foreground color/tint of a view.
 * @param color - The foreground color (hex string)
 */
export declare const foregroundColor: (color: string) => ModifierConfig;
/**
 * Sets the tint color of a view.
 * @param color - The tint color (hex string)
 */
export declare const tint: (color: string) => ModifierConfig;
/**
 * Hides or shows a view.
 * @param hidden - Whether the view should be hidden
 */
export declare const hidden: (hidden?: boolean) => ModifierConfig;
/**
 * Sets the z-index (display order) of a view.
 * @param index - The z-index value
 */
export declare const zIndex: (index: number) => ModifierConfig;
/**
 * Applies blur to a view.
 * @param radius - The blur radius
 */
export declare const blur: (radius: number) => ModifierConfig;
/**
 * Adjusts the brightness of a view.
 * @param amount - Brightness adjustment (-1 to 1)
 */
export declare const brightness: (amount: number) => ModifierConfig;
/**
 * Adjusts the contrast of a view.
 * @param amount - Contrast multiplier (0 to infinity, 1 = normal)
 */
export declare const contrast: (amount: number) => ModifierConfig;
/**
 * Adjusts the saturation of a view.
 * @param amount - Saturation multiplier (0 to infinity, 1 = normal)
 */
export declare const saturation: (amount: number) => ModifierConfig;
/**
 * Applies a hue rotation to a view.
 * @param angle - Hue rotation angle in degrees
 */
export declare const hueRotation: (angle: number) => ModifierConfig;
/**
 * Inverts the colors of a view.
 * @param inverted - Whether to invert colors
 */
export declare const colorInvert: (inverted?: boolean) => ModifierConfig;
/**
 * Makes a view grayscale.
 * @param amount - Grayscale amount (0 to 1)
 */
export declare const grayscale: (amount: number) => ModifierConfig;
/**
 * Sets accessibility label for the view.
 * @param label - The accessibility label
 */
export declare const accessibilityLabel: (label: string) => ModifierConfig;
/**
 * Sets accessibility hint for the view.
 * @param hint - The accessibility hint
 */
export declare const accessibilityHint: (hint: string) => ModifierConfig;
/**
 * Sets accessibility value for the view.
 * @param value - The accessibility value
 */
export declare const accessibilityValue: (value: string) => ModifierConfig;
/**
 * Sets layout priority for the view.
 * @param priority - Layout priority value
 */
export declare const layoutPriority: (priority: number) => ModifierConfig;
/**
 * Applies a mask to the view.
 * @param shape - The masking shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 */
export declare const mask: (shape: "rectangle" | "circle" | "roundedRectangle", cornerRadius?: number) => ModifierConfig;
/**
 * Overlays another view on top.
 * @param color - Overlay color
 * @param alignment - Overlay alignment
 */
export declare const overlay: (params: {
    color?: string;
    alignment?: "center" | "top" | "bottom" | "leading" | "trailing";
}) => ModifierConfig;
/**
 * Adds a background behind the view.
 * @param color - Background color
 * @param alignment - Background alignment
 */
export declare const backgroundOverlay: (params: {
    color?: string;
    alignment?: "center" | "top" | "bottom" | "leading" | "trailing";
}) => ModifierConfig;
/**
 * Sets aspect ratio constraint.
 * @param ratio - Width/height aspect ratio
 * @param contentMode - How content fits the aspect ratio
 */
export declare const aspectRatio: (params: {
    ratio: number;
    contentMode?: "fit" | "fill";
}) => ModifierConfig;
/**
 * Clips content to bounds.
 * @param clipped - Whether to clip content
 */
export declare const clipped: (clipped?: boolean) => ModifierConfig;
/**
 * Applies a glass effect to a view.
 */
export declare const glassEffect: (params?: {
    glass?: {
        variant: "regular" | "clear" | "identity";
        interactive?: boolean;
        tint?: string;
    };
    shape?: "circle" | "capsule" | "rectangle" | "ellipse";
}) => ModifierConfig;
/**
 * Union type of all built-in modifier return types.
 * This provides type safety for the modifiers array.
 */
export type BuiltInModifier = ReturnType<typeof background> | ReturnType<typeof cornerRadius> | ReturnType<typeof shadow> | ReturnType<typeof frame> | ReturnType<typeof padding> | ReturnType<typeof fixedSize> | ReturnType<typeof onTapGesture> | ReturnType<typeof onLongPressGesture> | ReturnType<typeof opacity> | ReturnType<typeof clipShape> | ReturnType<typeof border> | ReturnType<typeof scaleEffect> | ReturnType<typeof rotationEffect> | ReturnType<typeof offset> | ReturnType<typeof foregroundColor> | ReturnType<typeof tint> | ReturnType<typeof hidden> | ReturnType<typeof zIndex> | ReturnType<typeof blur> | ReturnType<typeof brightness> | ReturnType<typeof contrast> | ReturnType<typeof saturation> | ReturnType<typeof hueRotation> | ReturnType<typeof colorInvert> | ReturnType<typeof grayscale> | ReturnType<typeof accessibilityLabel> | ReturnType<typeof accessibilityHint> | ReturnType<typeof accessibilityValue> | ReturnType<typeof layoutPriority> | ReturnType<typeof mask> | ReturnType<typeof overlay> | ReturnType<typeof backgroundOverlay> | ReturnType<typeof aspectRatio> | ReturnType<typeof clipped> | ReturnType<typeof glassEffect>;
/**
 * Main ViewModifier type that supports both built-in and 3rd party modifiers.
 * 3rd party modifiers should return ModifierConfig objects with their own type strings.
 */
export type ViewModifier = BuiltInModifier | ModifierConfig;
/**
 * Creates a custom modifier for 3rd party libraries.
 * This function is exported so 3rd party packages can create their own modifiers.
 *
 * @example
 * ```typescript
 * // In a 3rd party package
 * export const blurEffect = (params: { radius: number; style?: string }) =>
 *   createModifier('blurEffect', params);
 * ```
 */
export { createModifier };
/**
 * Type guard to check if a value is a valid modifier.
 */
export declare const isModifier: (value: any) => value is ModifierConfig;
/**
 * Filters an array to only include valid modifiers.
 */
export declare const filterModifiers: (modifiers: unknown[]) => ModifierConfig[];
//# sourceMappingURL=index.d.ts.map