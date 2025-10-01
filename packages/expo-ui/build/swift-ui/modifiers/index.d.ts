/**
 * Core modifier factory and type definitions for SwiftUI view modifiers.
 * This system allows both built-in and 3rd party modifiers to use the same API.
 */
import { ColorValue } from 'react-native';
import { animation } from './animation/index';
import { containerShape } from './containerShape';
import { createModifier, ModifierConfig } from './createModifier';
type NamedColor = 'primary' | 'secondary' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'white' | 'gray' | 'black' | 'clear' | 'mint' | 'teal' | 'cyan' | 'indigo' | 'brown';
type Color = string | ColorValue | NamedColor;
/**
 * Sets the background of a view.
 * @param color - The background color (hex string, e.g., '#FF0000')
 */
export declare const background: (color: Color) => ModifierConfig;
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
    color?: Color;
}) => ModifierConfig;
/**
 * Adds a matched geometry effect to a view.
 */
export declare const matchedGeometryEffect: (id: string, namespaceId: string) => ModifierConfig;
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
 * @param horizontal - Whether the view should use its ideal width
 * @param vertical - Whether the view should use its ideal height
 */
export declare const fixedSize: (params?: {
    horizontal?: boolean;
    vertical?: boolean;
}) => ModifierConfig;
/**
 * Allows a view to ignore safe area constraints.
 * @param regions - The safe area regions to ignore ('all', 'container', 'keyboard')
 * @param edges - The edges to expand into ('all', 'top', 'bottom', 'leading', 'trailing', 'horizontal', 'vertical')
 */
export declare const ignoreSafeArea: (params?: {
    regions?: "all" | "container" | "keyboard";
    edges?: "all" | "top" | "bottom" | "leading" | "trailing" | "horizontal" | "vertical";
}) => ModifierConfig;
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
    color: Color;
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
 * @deprecated Use foregroundStyle instead
 */
export declare const foregroundColor: (color: Color) => ModifierConfig;
/**
 * Sets the foreground style of a view with comprehensive styling options.
 *
 * Replaces the deprecated `foregroundColor` modifier with enhanced capabilities including
 * colors, gradients, and semantic hierarchical styles that adapt to system appearance.
 *
 * @param style - The foreground style configuration. Can be:
 *
 * **Simple Color (string):**
 * - Hex colors: `'#FF0000'`, `'#RGB'`, `'#RRGGBB'`, `'#AARRGGBB'`
 * - Named colors: `'red'`, `'blue'`, `'green'`, etc.
 *
 * **Explicit Color Object:**
 * ```typescript
 * { type: 'color', color: '#FF0000' }
 * ```
 *
 * **Hierarchical Styles (Semantic):**
 * Auto-adapting semantic styles that respond to light/dark mode and accessibility settings:
 * ```typescript
 * { type: 'hierarchical', style: 'primary' }    // Most prominent (main content, headlines)
 * { type: 'hierarchical', style: 'secondary' }  // Supporting text, subheadlines
 * { type: 'hierarchical', style: 'tertiary' }   // Less important text, captions
 * { type: 'hierarchical', style: 'quaternary' } // Subtle text, disabled states
 * { type: 'hierarchical', style: 'quinary' }    // Most subtle (iOS 16+, fallback to quaternary)
 * ```
 *
 * **Linear Gradient:**
 * ```typescript
 * {
 *   type: 'linearGradient',
 *   colors: ['#FF0000', '#0000FF', '#00FF00'],
 *   startPoint: { x: 0, y: 0 },    // Top-left
 *   endPoint: { x: 1, y: 1 }       // Bottom-right
 * }
 * ```
 *
 * **Radial Gradient:**
 * ```typescript
 * {
 *   type: 'radialGradient',
 *   colors: ['#FF0000', '#0000FF'],
 *   center: { x: 0.5, y: 0.5 },    // Center of view
 *   startRadius: 0,                // Inner radius
 *   endRadius: 100                 // Outer radius
 * }
 * ```
 *
 * **Angular Gradient (Conic):**
 * ```typescript
 * {
 *   type: 'angularGradient',
 *   colors: ['#FF0000', '#00FF00', '#0000FF'],
 *   center: { x: 0.5, y: 0.5 }     // Rotation center
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Simple usage
 * <Text modifiers={[foregroundStyle('#FF0000')]}>Red Text</Text>
 *
 * // Adaptive hierarchical styling
 * <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
 *   Supporting Text
 * </Text>
 *
 * // Linear gradient
 * <Text modifiers={[foregroundStyle({
 *   type: 'linearGradient',
 *   colors: ['#FF6B35', '#F7931E', '#FFD23F'],
 *   startPoint: { x: 0, y: 0 },
 *   endPoint: { x: 1, y: 0 }
 * })]}>
 *   Gradient Text
 * </Text>
 * ```
 *
 * @returns A view modifier that applies the specified foreground style
 * @since iOS 15.0+ (hierarchical quinary requires iOS 16.0+)
 * @see https://developer.apple.com/documentation/swiftui/view/foregroundstyle(_:)
 */
export declare const foregroundStyle: (style: string | {
    type: "color";
    color: string;
} | {
    type: "hierarchical";
    style: "primary" | "secondary" | "tertiary" | "quaternary" | "quinary";
} | {
    type: "linearGradient";
    colors: string[];
    startPoint: {
        x: number;
        y: number;
    };
    endPoint: {
        x: number;
        y: number;
    };
} | {
    type: "radialGradient";
    colors: string[];
    center: {
        x: number;
        y: number;
    };
    startRadius: number;
    endRadius: number;
} | {
    type: "angularGradient";
    colors: string[];
    center: {
        x: number;
        y: number;
    };
}) => ModifierConfig;
/**
 * Sets the tint color of a view.
 * @param color - The tint color (hex string)
 */
export declare const tint: (color: Color) => ModifierConfig;
/**
 * Hides or shows a view.
 * @param hidden - Whether the view should be hidden
 */
export declare const hidden: (hidden?: boolean) => ModifierConfig;
/**
 * Disables or enables a view.
 * @param disabled - Whether the view should be disabled
 */
export declare const disabled: (disabled?: boolean) => ModifierConfig;
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
 * Sets the button style for button views.
 */
export declare const buttonStyle: (style: "automatic" | "bordered" | "borderedProminent" | "borderless" | "glass" | "glassProminent" | "plain") => ModifierConfig;
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
    color?: Color;
    alignment?: "center" | "top" | "bottom" | "leading" | "trailing";
}) => ModifierConfig;
/**
 * Adds a background behind the view.
 * @param color - Background color
 * @param alignment - Background alignment
 */
export declare const backgroundOverlay: (params: {
    color?: Color;
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
        tint?: Color;
    };
    shape?: "circle" | "capsule" | "rectangle" | "ellipse";
}) => ModifierConfig;
/**
 * Associates an identity value to Liquid Glass effects defined within a `GlassEffectContainer`.
 */
export declare const glassEffectId: (id: string, namespaceId: string) => ModifierConfig;
/**
 * Union type of all built-in modifier return types.
 * This provides type safety for the modifiers array.
 */
export type BuiltInModifier = ReturnType<typeof background> | ReturnType<typeof cornerRadius> | ReturnType<typeof shadow> | ReturnType<typeof frame> | ReturnType<typeof padding> | ReturnType<typeof fixedSize> | ReturnType<typeof ignoreSafeArea> | ReturnType<typeof onTapGesture> | ReturnType<typeof onLongPressGesture> | ReturnType<typeof opacity> | ReturnType<typeof clipShape> | ReturnType<typeof border> | ReturnType<typeof scaleEffect> | ReturnType<typeof rotationEffect> | ReturnType<typeof offset> | ReturnType<typeof foregroundColor> | ReturnType<typeof foregroundStyle> | ReturnType<typeof tint> | ReturnType<typeof hidden> | ReturnType<typeof disabled> | ReturnType<typeof zIndex> | ReturnType<typeof blur> | ReturnType<typeof brightness> | ReturnType<typeof contrast> | ReturnType<typeof saturation> | ReturnType<typeof hueRotation> | ReturnType<typeof colorInvert> | ReturnType<typeof grayscale> | ReturnType<typeof buttonStyle> | ReturnType<typeof accessibilityLabel> | ReturnType<typeof accessibilityHint> | ReturnType<typeof accessibilityValue> | ReturnType<typeof layoutPriority> | ReturnType<typeof mask> | ReturnType<typeof overlay> | ReturnType<typeof backgroundOverlay> | ReturnType<typeof aspectRatio> | ReturnType<typeof clipped> | ReturnType<typeof glassEffect> | ReturnType<typeof glassEffectId> | ReturnType<typeof animation> | ReturnType<typeof containerShape>;
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
export * from './animation/index';
export * from './containerShape';
//# sourceMappingURL=index.d.ts.map