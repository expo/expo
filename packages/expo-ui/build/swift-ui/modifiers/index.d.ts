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
 * Sets the spacing between adjacent sections.
 * @param spacing - The spacing to apply
 * @platform ios 17.0+
 */
export declare const listSectionSpacing: (spacing: "default" | "compact" | number) => ModifierConfig;
/**
 * Sets the background of a view.
 * @param color - The background color (hex string, e.g., '#FF0000')
 * @see https://developer.apple.com/documentation/SwiftUI/View/background(_:alignment:)
 */
export declare const background: (color: Color) => ModifierConfig;
/**
 * Applies corner radius to a view.
 * @param radius - The corner radius value
 * @see https://developer.apple.com/documentation/swiftui/view/cornerradius(_:antialiased:)
 */
export declare const cornerRadius: (radius: number) => ModifierConfig;
/**
 * Adds a shadow to a view.
 * @param params - The shadow parameters. Radius, offset and color.
 * @see https://developer.apple.com/documentation/SwiftUI/View/shadow(color:radius:x:y:)
 */
export declare const shadow: (params: {
    radius: number;
    x?: number;
    y?: number;
    color?: Color;
}) => ModifierConfig;
/**
 * Adds a matched geometry effect to a view.
 * @param id - The id of the view
 * @param namespaceId - The namespace id of the view. Use Namespace component to create a namespace.
 * @see https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)
 */
export declare const matchedGeometryEffect: (id: string, namespaceId: string) => ModifierConfig;
/**
 * Sets the frame properties of a view.
 * @param params - The frame parameters. Width, height, minWidth, maxWidth, minHeight, maxHeight, idealWidth, idealHeight and alignment.
 * @see https://developer.apple.com/documentation/SwiftUI/View/frame(width:height:alignment:)
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
 * @param params - The padding parameters. Top, bottom, leading, trailing, horizontal, vertical and all.
 * @see https://developer.apple.com/documentation/SwiftUI/View/padding(_:_:)
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
 * @param params - Whether the view should use its ideal width or height
 * @see https://developer.apple.com/documentation/swiftui/view/fixedsize()
 */
export declare const fixedSize: (params?: {
    horizontal?: boolean;
    vertical?: boolean;
}) => ModifierConfig;
/**
 * Allows a view to ignore safe area constraints.
 * @param params - The safe area regions to ignore and the edges to expand into
 * @see https://developer.apple.com/documentation/swiftui/view/ignoressafearea(_:edges:)
 */
export declare const ignoreSafeArea: (params?: {
    regions?: "all" | "container" | "keyboard";
    edges?: "all" | "top" | "bottom" | "leading" | "trailing" | "horizontal" | "vertical";
}) => ModifierConfig;
/**
 * Adds a tap gesture recognizer.
 * @param handler - Function to call when tapped
 * @see https://developer.apple.com/documentation/swiftui/view/ontapgesture(count:perform:)
 */
export declare const onTapGesture: (handler: () => void) => ModifierConfig;
/**
 * Adds a long press gesture recognizer.
 * @param handler - Function to call when long pressed
 * @param minimumDuration - Minimum duration for long press (default: 0.5s)
 */
export declare const onLongPressGesture: (handler: () => void, minimumDuration?: number) => ModifierConfig;
/**
 * Adds an onAppear modifier that calls a function when the view appears.
 * @param handler - Function to call when the view appears
 * @see https://developer.apple.com/documentation/swiftui/view/onlongpressgesture(minimumduration:perform:onpressingchanged:)
 */
export declare const onAppear: (handler: () => void) => ModifierConfig;
/**
 * Adds an onDisappear modifier that calls a function when the view disappears.
 * @param handler - Function to call when the view disappears
 * @see https://developer.apple.com/documentation/swiftui/view/ondisappear(perform:)
 */
export declare const onDisappear: (handler: () => void) => ModifierConfig;
/**
 * Sets the opacity of a view.
 * @param value - Opacity value between 0 and 1
 * @see https://developer.apple.com/documentation/swiftui/view/opacity(_:)
 */
export declare const opacity: (value: number) => ModifierConfig;
/**
 * Clips the view to a specific shape.
 * @param shape - The clipping shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 * @see https://developer.apple.com/documentation/swiftui/view/clipshape(_:style:)
 */
export declare const clipShape: (shape: "rectangle" | "circle" | "roundedRectangle", cornerRadius?: number) => ModifierConfig;
/**
 * Adds a border to a view.
 * @param params - The border parameters. Color and width.
 * @see https://developer.apple.com/documentation/swiftui/view/border(_:width:)
 */
export declare const border: (params: {
    color: Color;
    width?: number;
}) => ModifierConfig;
/**
 * Applies scaling transformation.
 * @param scale - Scale factor (1.0 = normal size)
 * @see https://developer.apple.com/documentation/swiftui/view/scaleeffect(_:anchor:)
 */
export declare const scaleEffect: (scale: number) => ModifierConfig;
/**
 * Applies rotation transformation.
 * @param angle - Rotation angle in degrees
 * @see https://developer.apple.com/documentation/swiftui/view/rotationeffect(_:anchor:)
 */
export declare const rotationEffect: (angle: number) => ModifierConfig;
/**
 * Applies an offset (translation) to a view.
 * @param params - The offset parameters. x and y.
 * @see https://developer.apple.com/documentation/swiftui/view/offset(x:y:)
 */
export declare const offset: (params: {
    x?: number;
    y?: number;
}) => ModifierConfig;
/**
 * Sets the foreground color/tint of a view.
 * @param color - The foreground color (hex string)
 * @deprecated Use foregroundStyle instead
 * @see https://developer.apple.com/documentation/swiftui/view/foregroundcolor(_:)
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
 * @see https://developer.apple.com/documentation/swiftui/view/tint(_:)
 */
export declare const tint: (color: Color) => ModifierConfig;
/**
 * Hides or shows a view.
 * @param hidden - Whether the view should be hidden
 * @see https://developer.apple.com/documentation/swiftui/view/hidden(_:)
 */
export declare const hidden: (hidden?: boolean) => ModifierConfig;
/**
 * Disables or enables a view.
 * @param disabled - Whether the view should be disabled
 * @see https://developer.apple.com/documentation/swiftui/view/disabled(_:)
 */
export declare const disabled: (disabled?: boolean) => ModifierConfig;
/**
 * Sets the z-index (display order) of a view.
 * @param index - The z-index value
 * @see https://developer.apple.com/documentation/swiftui/view/zindex(_:)
 */
export declare const zIndex: (index: number) => ModifierConfig;
/**
 * Applies blur to a view.
 * @param radius - The blur radius
 * @see https://developer.apple.com/documentation/swiftui/view/blur(radius:opaque:)
 */
export declare const blur: (radius: number) => ModifierConfig;
/**
 * Adjusts the brightness of a view.
 * @param amount - Brightness adjustment (-1 to 1)
 * @see https://developer.apple.com/documentation/swiftui/view/brightness(_:)
 */
export declare const brightness: (amount: number) => ModifierConfig;
/**
 * Adjusts the contrast of a view.
 * @param amount - Contrast multiplier (0 to infinity, 1 = normal)
 * @see https://developer.apple.com/documentation/swiftui/view/contrast(_:)
 */
export declare const contrast: (amount: number) => ModifierConfig;
/**
 * Adjusts the saturation of a view.
 * @param amount - Saturation multiplier (0 to infinity, 1 = normal)
 * @see https://developer.apple.com/documentation/swiftui/view/saturation(_:)
 */
export declare const saturation: (amount: number) => ModifierConfig;
/**
 * Applies a hue rotation to a view.
 * @param angle - Hue rotation angle in degrees
 * @see https://developer.apple.com/documentation/swiftui/view/huerotation(_:)
 */
export declare const hueRotation: (angle: number) => ModifierConfig;
/**
 * Inverts the colors of a view.
 * @param inverted - Whether to invert colors
 * @see https://developer.apple.com/documentation/swiftui/view/colorinvert()
 */
export declare const colorInvert: (inverted?: boolean) => ModifierConfig;
/**
 * Makes a view grayscale.
 * @param amount - Grayscale amount (0 to 1)
 * @see https://developer.apple.com/documentation/swiftui/view/grayscale(_:)
 */
export declare const grayscale: (amount: number) => ModifierConfig;
/**
 * Sets the button style for button views.
 * @param style - The button style
 * @see https://developer.apple.com/documentation/swiftui/view/buttonstyle(_:)
 */
export declare const buttonStyle: (style: "automatic" | "bordered" | "borderedProminent" | "borderless" | "glass" | "glassProminent" | "plain") => ModifierConfig;
/**
 * Controls how the keyboard is dismissed when scrolling.
 * @param mode - The keyboard dismiss mode
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see https://developer.apple.com/documentation/swiftui/view/scrolldismisseskeyboard(_:)
 */
export declare const scrollDismissesKeyboard: (mode: "automatic" | "never" | "interactively" | "immediately") => ModifierConfig;
/**
 * Sets accessibility label for the view.
 * @param label - The accessibility label
 * @see https://developer.apple.com/documentation/swiftui/view/accessibilitylabel(_:)
 */
export declare const accessibilityLabel: (label: string) => ModifierConfig;
/**
 * Sets accessibility hint for the view.
 * @param hint - The accessibility hint
 * @see https://developer.apple.com/documentation/swiftui/view/accessibilityhint(_:)
 */
export declare const accessibilityHint: (hint: string) => ModifierConfig;
/**
 * Sets accessibility value for the view.
 * @param value - The accessibility value
 * @see https://developer.apple.com/documentation/swiftui/view/accessibilityvalue(_:)
 */
export declare const accessibilityValue: (value: string) => ModifierConfig;
/**
 * Sets layout priority for the view.
 * @param priority - Layout priority value
 * @see https://developer.apple.com/documentation/swiftui/view/layoutpriority(_:)
 */
export declare const layoutPriority: (priority: number) => ModifierConfig;
/**
 * Applies a mask to the view.
 * @param shape - The masking shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 * @see https://developer.apple.com/documentation/swiftui/view/mask(_:)
 */
export declare const mask: (shape: "rectangle" | "circle" | "roundedRectangle", cornerRadius?: number) => ModifierConfig;
/**
 * Overlays another view on top.
 * @param params - Overlay color and alignment
 * @see https://developer.apple.com/documentation/swiftui/view/overlay(_:alignment:)
 */
export declare const overlay: (params: {
    color?: Color;
    alignment?: "center" | "top" | "bottom" | "leading" | "trailing";
}) => ModifierConfig;
/**
 * Adds a background behind the view.
 * @param params - Background color and alignment
 */
export declare const backgroundOverlay: (params: {
    color?: Color;
    alignment?: "center" | "top" | "bottom" | "leading" | "trailing";
}) => ModifierConfig;
/**
 * Sets aspect ratio constraint.
 * @param params - Width/height aspect ratio and content mode
 * @see https://developer.apple.com/documentation/swiftui/view/aspectratio(_:contentmode:)
 */
export declare const aspectRatio: (params: {
    ratio: number;
    contentMode?: "fit" | "fill";
}) => ModifierConfig;
/**
 * Clips content to bounds.
 * @param clipped - Whether to clip content
 * @see https://developer.apple.com/documentation/swiftui/view/clipped(antialiased:)
 */
export declare const clipped: (clipped?: boolean) => ModifierConfig;
/**
 * Applies a glass effect to a view.
 * @param params - The glass effect parameters. Variant, interactive, tint and shape.
 * @see https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)
 */
export declare const glassEffect: (params?: {
    glass?: {
        variant: "regular" | "clear" | "identity";
        interactive?: boolean;
        tint?: Color;
    };
    shape?: "circle" | "capsule" | "rectangle" | "ellipse" | "roundedRectangle";
    cornerRadius?: number;
}) => ModifierConfig;
/**
 * Associates an identity value to Liquid Glass effects defined within a `GlassEffectContainer`.
 * @param id - The id of the glass effect
 * @param namespaceId - The namespace id of the glass effect. Use Namespace component to create a namespace.
 * @see https://developer.apple.com/documentation/swiftui/view/glasseffectid(_:in:)
 */
export declare const glassEffectId: (id: string, namespaceId: string) => ModifierConfig;
/**
 * Specifies the visibility of the background for scrollable views within this view.
 * @param visible - The visibility of the background
 * @see https://developer.apple.com/documentation/swiftui/view/scrollcontentbackground(_:)
 */
export declare const scrollContentBackground: (visible: "automatic" | "visible" | "hidden") => ModifierConfig;
/**
 * Sets the background of a row.
 * @param color - The row color (hex string, e.g., '#FF0000')
 * @see https://developer.apple.com/documentation/swiftui/view/listrowbackground(_:)
 */
export declare const listRowBackground: (color: Color) => ModifierConfig;
/**
 * Sets the truncation mode for lines of text that are too long to fit in the available space.
 * @param mode - The truncation mode that specifies where to truncate the text within the text view, if needed.
 * You can truncate at the beginning, middle, or end of the text view.
 * @see https://developer.apple.com/documentation/swiftui/view/truncationmode(_:)
 */
export declare const truncationMode: (mode: "head" | "middle" | "tail") => ModifierConfig;
/**
 * Sets whether text in this view can compress the space between characters when necessary to fit text in a line
 * @default true
 * @see https://developer.apple.com/documentation/swiftui/view/allowstightening(_:)
 */
export declare const allowsTightening: (value: boolean) => ModifierConfig;
/**
 * Sets the spacing, or kerning, between characters for the text in this view.
 * @default 0
 * @see https://developer.apple.com/documentation/swiftui/view/kerning(_:)
 */
export declare const kerning: (value?: number) => ModifierConfig;
/**
 * Sets a transform for the case of the text contained in this view when displayed.
 * @default "lowercase"
 * @see https://developer.apple.com/documentation/swiftui/view/textcase(_:)
 */
export declare const textCase: (value: "lowercase" | "uppercase") => ModifierConfig;
type LinePattern = 'solid' | 'dash' | 'dot' | 'dashDot' | 'dashDotDot';
/**
 * Applies an underline to the text.
 *
 * @param params - Controls whether the underline is visible (`true` to show, false to hide).
 * @see https://developer.apple.com/documentation/swiftui/view/underline(_:pattern:color:)
 */
export declare const underline: (params: {
    isActive: boolean;
    pattern: LinePattern;
    color?: Color;
}) => ModifierConfig;
/**
 * Applies a strikethrough to the text.
 *
 * @param params - Controls whether the strikethrough is visible (`true` to show, false to hide).
 * @see https://developer.apple.com/documentation/swiftui/text/strikethrough(_:color:)
 */
export declare const strikethrough: (params: {
    isActive: boolean;
    pattern: LinePattern;
    color?: Color;
}) => ModifierConfig;
/**
 * An alignment position for text along the horizontal axis.
 *
 * @param alignment - A value that you use to align multiple lines of text within a view.
 * @see https://developer.apple.com/documentation/swiftui/view/multilinetextalignment(_:)
 */
export declare const multilineTextAlignment: (alignment: "center" | "leading" | "trailing") => ModifierConfig;
/**
 * Controls whether people can select text within this view.
 * @param value - Enable selection
 * @see https://developer.apple.com/documentation/swiftui/view/textselection(_:)
 */
export declare const textSelection: (value: boolean) => ModifierConfig;
/**
 * The distance in points between the bottom of one line fragment and the top of the next.
 * @param value - The amount of space between the bottom of one line and the top of the next line in points. This value is always nonnegative. Otherwise, the default value will be used.
 * @see https://developer.apple.com/documentation/swiftui/view/linespacing(_:)
 */
export declare const lineSpacing: (value: number) => ModifierConfig;
/**
 * Sets the header prominence for this view.
 * @param prominence - The prominence to apply.
 */
export declare const headerProminence: (prominence: "standard" | "increased") => ModifierConfig;
/**
 * Applies an inset to the rows in a list.
 * @param params - The inset to apply to the rows in a list.
 * @see https://developer.apple.com/documentation/swiftui/view/listrowinsets(_:)
 */
export declare const listRowInsets: (params: {
    top?: number;
    leading?: number;
    bottom?: number;
    trailing?: number;
}) => ModifierConfig;
/**
 * The prominence to apply to badges associated with this environment.
 * @param badgeType - Select the type of badge
 * @see https://developer.apple.com/documentation/swiftui/view/badgeprominence(_:)
 */
export declare const badgeProminence: (badgeType: "standard" | "increased" | "decreased") => ModifierConfig;
/**
 * Generates a badge for the view from a localized string key.
 * @param value - Text view to display as a badge. Set the value to nil to hide the badge.
 * @see https://developer.apple.com/documentation/swiftui/view/badge(_:)
 */
export declare const badge: (value?: string) => ModifierConfig;
/**
 * Allows a view to ignore safe area constraints.
 * @platform iOS 26+
 * @param params - The margins to apply to the section in a list.
 * @see https://developer.apple.com/documentation/swiftui/view/listsectionmargins(_:_:)
 */
export declare const listSectionMargins: (params?: {
    length?: number;
    edges?: "all" | "top" | "bottom" | "leading" | "trailing" | "horizontal" | "vertical";
}) => ModifierConfig;
/**
 * Sets the font properties of a view.
 * Supports both custom font families and system fonts with weight and design options.
 *
 * @param params - The font configuration. When `family` is provided, it uses Font.custom().
 * When `family` is not provided, it uses Font.system() with the specified weight and design.
 *
 * @example
 * ```typescript
 * // Custom font family
 * <Text modifiers={[font({ family: 'Helvetica', size: 18 })]}>Custom Font Text</Text>
 *
 * // System font with weight and design
 * <Text modifiers={[font({ weight: 'bold', design: 'rounded', size: 16 })]}>System Font Text</Text>
 * ```
 * @see https://developer.apple.com/documentation/swiftui/font/custom(_:size:)
 * @see https://developer.apple.com/documentation/swiftui/font/system(size:weight:design:)
 */
export declare const font: (params: {
    /** Custom font family name. If provided, uses Font.custom() */
    family?: string;
    /** Font size in points */
    size?: number;
    /** Font weight for system fonts */
    weight?: "ultraLight" | "thin" | "light" | "regular" | "medium" | "semibold" | "bold" | "heavy" | "black";
    /** Font design for system fonts */
    design?: "default" | "rounded" | "serif" | "monospaced";
}) => ModifierConfig;
/**
 * Union type of all built-in modifier return types.
 * This provides type safety for the modifiers array.
 * @hidden
 */
export type BuiltInModifier = ReturnType<typeof listSectionSpacing> | ReturnType<typeof background> | ReturnType<typeof cornerRadius> | ReturnType<typeof shadow> | ReturnType<typeof frame> | ReturnType<typeof padding> | ReturnType<typeof fixedSize> | ReturnType<typeof ignoreSafeArea> | ReturnType<typeof onTapGesture> | ReturnType<typeof onLongPressGesture> | ReturnType<typeof onAppear> | ReturnType<typeof onDisappear> | ReturnType<typeof opacity> | ReturnType<typeof clipShape> | ReturnType<typeof border> | ReturnType<typeof scaleEffect> | ReturnType<typeof rotationEffect> | ReturnType<typeof offset> | ReturnType<typeof foregroundColor> | ReturnType<typeof foregroundStyle> | ReturnType<typeof tint> | ReturnType<typeof hidden> | ReturnType<typeof disabled> | ReturnType<typeof zIndex> | ReturnType<typeof blur> | ReturnType<typeof brightness> | ReturnType<typeof contrast> | ReturnType<typeof saturation> | ReturnType<typeof hueRotation> | ReturnType<typeof colorInvert> | ReturnType<typeof grayscale> | ReturnType<typeof buttonStyle> | ReturnType<typeof accessibilityLabel> | ReturnType<typeof accessibilityHint> | ReturnType<typeof accessibilityValue> | ReturnType<typeof layoutPriority> | ReturnType<typeof mask> | ReturnType<typeof overlay> | ReturnType<typeof backgroundOverlay> | ReturnType<typeof aspectRatio> | ReturnType<typeof clipped> | ReturnType<typeof glassEffect> | ReturnType<typeof glassEffectId> | ReturnType<typeof animation> | ReturnType<typeof containerShape> | ReturnType<typeof scrollContentBackground> | ReturnType<typeof listRowBackground> | ReturnType<typeof truncationMode> | ReturnType<typeof allowsTightening> | ReturnType<typeof kerning> | ReturnType<typeof textCase> | ReturnType<typeof underline> | ReturnType<typeof strikethrough> | ReturnType<typeof multilineTextAlignment> | ReturnType<typeof textSelection> | ReturnType<typeof lineSpacing> | ReturnType<typeof headerProminence> | ReturnType<typeof listRowInsets> | ReturnType<typeof badgeProminence> | ReturnType<typeof badge> | ReturnType<typeof listSectionMargins> | ReturnType<typeof font>;
/**
 * Main ViewModifier type that supports both built-in and 3rd party modifiers.
 * 3rd party modifiers should return ModifierConfig objects with their own type strings.
 * @hidden
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
 * @hidden
 */
export declare const isModifier: (value: any) => value is ModifierConfig;
/**
 * Filters an array to only include valid modifiers.
 * @hidden
 */
export declare const filterModifiers: (modifiers: unknown[]) => ModifierConfig[];
export * from './animation/index';
export * from './containerShape';
//# sourceMappingURL=index.d.ts.map