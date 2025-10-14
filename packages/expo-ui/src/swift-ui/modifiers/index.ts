/**
 * Core modifier factory and type definitions for SwiftUI view modifiers.
 * This system allows both built-in and 3rd party modifiers to use the same API.
 */

import { ColorValue } from 'react-native';

import { animation } from './animation/index';
import { containerShape } from './containerShape';
import { createModifier, ModifierConfig } from './createModifier';

/**
 * Creates a modifier with an event listener.
 */
function createModifierWithEventListener(
  type: string,
  eventListener: (args: any) => void,
  params: Record<string, any> = {}
): ModifierConfig {
  return { $type: type, ...params, eventListener };
}

type NamedColor =
  | 'primary'
  | 'secondary'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'white'
  | 'gray'
  | 'black'
  | 'clear'
  | 'mint'
  | 'teal'
  | 'cyan'
  | 'indigo'
  | 'brown';

type Color = string | ColorValue | NamedColor;

// =============================================================================
// Built-in Modifier Functions
// =============================================================================

/**
 * Sets the background of a view.
 * @param color - The background color (hex string, e.g., '#FF0000')
 */
export const background = (color: Color) => createModifier('background', { color });

/**
 * Applies corner radius to a view.
 * @param radius - The corner radius value
 */
export const cornerRadius = (radius: number) => createModifier('cornerRadius', { radius });

/**
 * Adds a shadow to a view.
 */
export const shadow = (params: { radius: number; x?: number; y?: number; color?: Color }) =>
  createModifier('shadow', params);

/**
 * Adds a matched geometry effect to a view.
 */
export const matchedGeometryEffect = (id: string, namespaceId: string) =>
  createModifier('matchedGeometryEffect', { id, namespaceId });

/**
 * Sets the frame properties of a view.
 */
export const frame = (params: {
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  idealWidth?: number;
  idealHeight?: number;
  alignment?:
    | 'center'
    | 'leading'
    | 'trailing'
    | 'top'
    | 'bottom'
    | 'topLeading'
    | 'topTrailing'
    | 'bottomLeading'
    | 'bottomTrailing';
}) => createModifier('frame', params);

/**
 * Sets padding on a view.
 * Supports individual edges or shorthand properties.
 */
export const padding = (params: {
  top?: number;
  bottom?: number;
  leading?: number;
  trailing?: number;
  horizontal?: number;
  vertical?: number;
  all?: number;
}) => createModifier('padding', params);

/**
 * Controls fixed size behavior.
 * @param horizontal - Whether the view should use its ideal width
 * @param vertical - Whether the view should use its ideal height
 */
export const fixedSize = (params?: { horizontal?: boolean; vertical?: boolean }) =>
  createModifier('fixedSize', params);

/**
 * Allows a view to ignore safe area constraints.
 * @param regions - The safe area regions to ignore ('all', 'container', 'keyboard')
 * @param edges - The edges to expand into ('all', 'top', 'bottom', 'leading', 'trailing', 'horizontal', 'vertical')
 */
export const ignoreSafeArea = (params?: {
  regions?: 'all' | 'container' | 'keyboard';
  edges?: 'all' | 'top' | 'bottom' | 'leading' | 'trailing' | 'horizontal' | 'vertical';
}) => createModifier('ignoreSafeArea', params);

/**
 * Adds a tap gesture recognizer.
 * @param handler - Function to call when tapped
 */
export const onTapGesture = (handler: () => void) =>
  createModifierWithEventListener('onTapGesture', handler);

/**
 * Adds a long press gesture recognizer.
 * @param handler - Function to call when long pressed
 * @param minimumDuration - Minimum duration for long press (default: 0.5s)
 */
export const onLongPressGesture = (handler: () => void, minimumDuration?: number) =>
  createModifierWithEventListener('onLongPressGesture', handler, {
    minimumDuration: minimumDuration ?? 0.5,
  });

/**
 * Adds an onAppear modifier that calls a function when the view appears.
 * @param handler - Function to call when the view appears
 */
export const onAppear = (handler: () => void) =>
  createModifierWithEventListener('onAppear', handler);

/**
 * Adds an onDisappear modifier that calls a function when the view disappears.
 * @param handler - Function to call when the view disappears
 */
export const onDisappear = (handler: () => void) =>
  createModifierWithEventListener('onDisappear', handler);

// Note: Complex gesture modifiers like onDragGesture are not available
// in the modifier system. Use component-level props instead.

/**
 * Sets the opacity of a view.
 * @param value - Opacity value between 0 and 1
 */
export const opacity = (value: number) => createModifier('opacity', { value });

/**
 * Clips the view to a specific shape.
 * @param shape - The clipping shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 */
export const clipShape = (
  shape: 'rectangle' | 'circle' | 'roundedRectangle',
  cornerRadius?: number
) => createModifier('clipShape', { shape, cornerRadius });

/**
 * Adds a border to a view.
 */
export const border = (params: { color: Color; width?: number }) =>
  createModifier('border', params);

/**
 * Applies scaling transformation.
 * @param scale - Scale factor (1.0 = normal size)
 */
export const scaleEffect = (scale: number) => createModifier('scaleEffect', { scale });

/**
 * Applies rotation transformation.
 * @param angle - Rotation angle in degrees
 */
export const rotationEffect = (angle: number) => createModifier('rotationEffect', { angle });

/**
 * Applies an offset (translation) to a view.
 */
export const offset = (params: { x?: number; y?: number }) => createModifier('offset', params);

/**
 * Sets the foreground color/tint of a view.
 * @param color - The foreground color (hex string)
 * @deprecated Use foregroundStyle instead
 */
export const foregroundColor = (color: Color) => createModifier('foregroundColor', { color });

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
export const foregroundStyle = (
  style:
    | string // Simple color (hex string, color name, or Apple system color name)
    | { type: 'color'; color: string }
    | {
        type: 'hierarchical';
        style: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'quinary';
      }
    | {
        type: 'linearGradient';
        colors: string[];
        startPoint: { x: number; y: number };
        endPoint: { x: number; y: number };
      }
    | {
        type: 'radialGradient';
        colors: string[];
        center: { x: number; y: number };
        startRadius: number;
        endRadius: number;
      }
    | {
        type: 'angularGradient';
        colors: string[];
        center: { x: number; y: number };
      }
) => {
  if (typeof style === 'string') {
    return createModifier('foregroundStyle', { styleType: 'color', color: style });
  }
  return createModifier('foregroundStyle', { styleType: style.type, ...style });
};

/**
 * Sets the tint color of a view.
 * @param color - The tint color (hex string)
 */
export const tint = (color: Color) => createModifier('tint', { color });

/**
 * Hides or shows a view.
 * @param hidden - Whether the view should be hidden
 */
export const hidden = (hidden: boolean = true) => createModifier('hidden', { hidden });

/**
 * Disables or enables a view.
 * @param disabled - Whether the view should be disabled
 */
export const disabled = (disabled: boolean = true) => createModifier('disabled', { disabled });

/**
 * Sets the z-index (display order) of a view.
 * @param index - The z-index value
 */
export const zIndex = (index: number) => createModifier('zIndex', { index });

/**
 * Applies blur to a view.
 * @param radius - The blur radius
 */
export const blur = (radius: number) => createModifier('blur', { radius });

/**
 * Adjusts the brightness of a view.
 * @param amount - Brightness adjustment (-1 to 1)
 */
export const brightness = (amount: number) => createModifier('brightness', { amount });

/**
 * Adjusts the contrast of a view.
 * @param amount - Contrast multiplier (0 to infinity, 1 = normal)
 */
export const contrast = (amount: number) => createModifier('contrast', { amount });

/**
 * Adjusts the saturation of a view.
 * @param amount - Saturation multiplier (0 to infinity, 1 = normal)
 */
export const saturation = (amount: number) => createModifier('saturation', { amount });

/**
 * Applies a hue rotation to a view.
 * @param angle - Hue rotation angle in degrees
 */
export const hueRotation = (angle: number) => createModifier('hueRotation', { angle });

/**
 * Inverts the colors of a view.
 * @param inverted - Whether to invert colors
 */
export const colorInvert = (inverted: boolean = true) =>
  createModifier('colorInvert', { inverted });

/**
 * Makes a view grayscale.
 * @param amount - Grayscale amount (0 to 1)
 */
export const grayscale = (amount: number) => createModifier('grayscale', { amount });

/**
 * Sets the button style for button views.
 */
export const buttonStyle = (
  style:
    | 'automatic'
    | 'bordered'
    | 'borderedProminent'
    | 'borderless'
    | 'glass'
    | 'glassProminent'
    | 'plain'
) => createModifier('buttonStyle', { style });

/**
 * Controls how the keyboard is dismissed when scrolling.
 * @param mode - The keyboard dismiss mode
 * @platform ios 16.0+
 */
export const scrollDismissesKeyboard = (
  mode: 'automatic' | 'never' | 'interactively' | 'immediately'
) => createModifier('scrollDismissesKeyboard', { mode });

/**
 * Sets accessibility label for the view.
 * @param label - The accessibility label
 */
export const accessibilityLabel = (label: string) =>
  createModifier('accessibilityLabel', { label });

/**
 * Sets accessibility hint for the view.
 * @param hint - The accessibility hint
 */
export const accessibilityHint = (hint: string) => createModifier('accessibilityHint', { hint });

/**
 * Sets accessibility value for the view.
 * @param value - The accessibility value
 */
export const accessibilityValue = (value: string) =>
  createModifier('accessibilityValue', { value });

/**
 * Sets layout priority for the view.
 * @param priority - Layout priority value
 */
export const layoutPriority = (priority: number) => createModifier('layoutPriority', { priority });

/**
 * Applies a mask to the view.
 * @param shape - The masking shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 */
export const mask = (shape: 'rectangle' | 'circle' | 'roundedRectangle', cornerRadius?: number) =>
  createModifier('mask', { shape, cornerRadius });

/**
 * Overlays another view on top.
 * @param color - Overlay color
 * @param alignment - Overlay alignment
 */
export const overlay = (params: {
  color?: Color;
  alignment?: 'center' | 'top' | 'bottom' | 'leading' | 'trailing';
}) => createModifier('overlay', params);

/**
 * Adds a background behind the view.
 * @param color - Background color
 * @param alignment - Background alignment
 */
export const backgroundOverlay = (params: {
  color?: Color;
  alignment?: 'center' | 'top' | 'bottom' | 'leading' | 'trailing';
}) => createModifier('backgroundOverlay', params);

/**
 * Sets aspect ratio constraint.
 * @param ratio - Width/height aspect ratio
 * @param contentMode - How content fits the aspect ratio
 */
export const aspectRatio = (params: { ratio: number; contentMode?: 'fit' | 'fill' }) =>
  createModifier('aspectRatio', params);

/**
 * Clips content to bounds.
 * @param clipped - Whether to clip content
 */
export const clipped = (clipped: boolean = true) => createModifier('clipped', { clipped });

/**
 * Applies a glass effect to a view.
 */
export const glassEffect = (params?: {
  glass?: {
    variant: 'regular' | 'clear' | 'identity';
    interactive?: boolean;
    tint?: Color;
  };
  shape?: 'circle' | 'capsule' | 'rectangle' | 'ellipse';
}) => createModifier('glassEffect', params);

/**
 * Associates an identity value to Liquid Glass effects defined within a `GlassEffectContainer`.
 */
export const glassEffectId = (id: string, namespaceId: string) =>
  createModifier('glassEffectId', {
    id,
    namespaceId,
  });

/**
 * Specifies the visibility of the background for scrollable views within this view.
 */
export const scrollContentBackground = (visible: 'automatic' | 'visible' | 'hidden') =>
  createModifier('scrollContentBackground', { visible });

/**
 * Sets the background of a row.
 * @param color - The row color (hex string, e.g., '#FF0000')
 */
export const listRowBackground = (color: Color) => createModifier('listRowBackground', { color });

/**
 * Sets the truncation mode for lines of text that are too long to fit in the available space.
 * @param mode - The truncation mode that specifies where to truncate the text within the text view, if needed.
 * You can truncate at the beginning, middle, or end of the text view.
 */
export const truncationMode = (mode: 'head' | 'middle' | 'tail') =>
  createModifier('truncationMode', { mode });
/**
 * Sets whether text in this view can compress the space between characters when necessary to fit text in a line
 * @default true
 */
export const allowsTightening = (value: boolean) => createModifier('allowsTightening', { value });
/**
 * Sets the spacing, or kerning, between characters for the text in this view.
 * @default 0
 */
export const kerning = (value?: number) => createModifier('kerning', { value });
/**
 * Sets a transform for the case of the text contained in this view when displayed.
 * @default "lowercase"
 */
export const textCase = (value: 'lowercase' | 'uppercase') => createModifier('textCase', { value });

type LinePattern = 'solid' | 'dash' | 'dot' | 'dashDot' | 'dashDotDot';

/**
 * Applies an underline to the text.
 *
 * @param isActive - Controls whether the underline is visible (`true` to show, false to hide).
 * @param pattern - Defines the underline style or pattern. Default - 'solid'
 * @param color - Sets the color of the underline. If not provided, the system default text color is used.
 */
export const underline = (params: { isActive: boolean; pattern: LinePattern; color?: Color }) =>
  createModifier('underline', params);
/**
 * Applies a strikethrough to the text.
 *
 * @param isActive - Controls whether the strikethrough is visible (`true` to show, false to hide).
 * @param pattern - Defines the strikethrough style or pattern. Default - 'solid'
 * @param color - Sets the color of the strikethrough. If not provided, the system default text color is used.
 */
export const strikethrough = (params: { isActive: boolean; pattern: LinePattern; color?: Color }) =>
  createModifier('strikethrough', params);

/**
 * An alignment position for text along the horizontal axis.
 *
 * @param alignment - A value that you use to align multiple lines of text within a view.
 */
export const multilineTextAlignment = (alignment: 'center' | 'leading' | 'trailing') =>
  createModifier('multilineTextAlignment', { alignment });

/**
 * Controls whether people can select text within this view.
 * @param value - Enable selection
 */
export const textSelection = (value: boolean) => createModifier('textSelection', { value });
/**
 * The distance in points between the bottom of one line fragment and the top of the next.
 * @param value - The amount of space between the bottom of one line and the top of the next line in points.
 * @description This value is always nonnegative. Otherwise, the default value will be used.
 */
export const lineSpacing = (value: number) => createModifier('lineSpacing', { value });
/**
 * Applies an inset to the rows in a list.
 * @param top - The amount of inset to apply to the **top** edge of each row.
 * @param leading - The amount of inset to apply to the **leading (left)** edge of each row.
 * @param bottom - The amount of inset to apply to the **bottom** edge of each row.
 * @param trailing - The amount of inset to apply to the **trailing (right)** edge of each row.
 */
export const listRowInsets = (params: {
  top?: number;
  leading?: number;
  bottom?: number;
  trailing?: number;
}) => createModifier('listRowInsets', params);
/**
 * The prominence to apply to badges associated with this environment.
 * @param badgeType - Select the type of badge
 */
export const badgeProminence = (badgeType: 'standard' | 'increased' | 'decreased') =>
  createModifier('badgeProminence', { badgeType });
/**
 * Generates a badge for the view from a localized string key.
 * @param value - Text view to display as a badge. Set the value to nil to hide the badge.
 */
export const badge = (value?: string) => createModifier('badge', { value });
/**
 * Allows a view to ignore safe area constraints.
 * @platform iOS 26+
 * @param length - An amount, given in points, to pad section on the specified edges.
 * @param edges - The edges to expand into ('all', 'top', 'bottom', 'leading', 'trailing', 'horizontal', 'vertical')
 * @default edges: 'all'
 */
export const listSectionMargins = (params?: {
  length?: number;
  edges?: 'all' | 'top' | 'bottom' | 'leading' | 'trailing' | 'horizontal' | 'vertical';
}) => createModifier('listSectionMargins', params);

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Union type of all built-in modifier return types.
 * This provides type safety for the modifiers array.
 */
export type BuiltInModifier =
  | ReturnType<typeof background>
  | ReturnType<typeof cornerRadius>
  | ReturnType<typeof shadow>
  | ReturnType<typeof frame>
  | ReturnType<typeof padding>
  | ReturnType<typeof fixedSize>
  | ReturnType<typeof ignoreSafeArea>
  | ReturnType<typeof onTapGesture>
  | ReturnType<typeof onLongPressGesture>
  | ReturnType<typeof onAppear>
  | ReturnType<typeof onDisappear>
  | ReturnType<typeof opacity>
  | ReturnType<typeof clipShape>
  | ReturnType<typeof border>
  | ReturnType<typeof scaleEffect>
  | ReturnType<typeof rotationEffect>
  | ReturnType<typeof offset>
  | ReturnType<typeof foregroundColor>
  | ReturnType<typeof foregroundStyle>
  | ReturnType<typeof tint>
  | ReturnType<typeof hidden>
  | ReturnType<typeof disabled>
  | ReturnType<typeof zIndex>
  | ReturnType<typeof blur>
  | ReturnType<typeof brightness>
  | ReturnType<typeof contrast>
  | ReturnType<typeof saturation>
  | ReturnType<typeof hueRotation>
  | ReturnType<typeof colorInvert>
  | ReturnType<typeof grayscale>
  | ReturnType<typeof buttonStyle>
  | ReturnType<typeof scrollDismissesKeyboard>
  | ReturnType<typeof accessibilityLabel>
  | ReturnType<typeof accessibilityHint>
  | ReturnType<typeof accessibilityValue>
  | ReturnType<typeof layoutPriority>
  | ReturnType<typeof mask>
  | ReturnType<typeof overlay>
  | ReturnType<typeof backgroundOverlay>
  | ReturnType<typeof aspectRatio>
  | ReturnType<typeof clipped>
  | ReturnType<typeof glassEffect>
  | ReturnType<typeof glassEffectId>
  | ReturnType<typeof animation>
  | ReturnType<typeof containerShape>
  | ReturnType<typeof scrollContentBackground>
  | ReturnType<typeof listRowBackground>
  | ReturnType<typeof truncationMode>
  | ReturnType<typeof allowsTightening>
  | ReturnType<typeof kerning>
  | ReturnType<typeof textCase>
  | ReturnType<typeof underline>
  | ReturnType<typeof strikethrough>
  | ReturnType<typeof multilineTextAlignment>
  | ReturnType<typeof textSelection>
  | ReturnType<typeof lineSpacing>
  | ReturnType<typeof listRowInsets>
  | ReturnType<typeof badgeProminence>
  | ReturnType<typeof badge>
  | ReturnType<typeof listSectionMargins>;

/**
 * Main ViewModifier type that supports both built-in and 3rd party modifiers.
 * 3rd party modifiers should return ModifierConfig objects with their own type strings.
 */
export type ViewModifier = BuiltInModifier | ModifierConfig;

// =============================================================================
// Utility Functions
// =============================================================================

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
export const isModifier = (value: any): value is ModifierConfig => {
  return typeof value === 'object' && value !== null && typeof value.$type === 'string';
};

/**
 * Filters an array to only include valid modifiers.
 */
export const filterModifiers = (modifiers: unknown[]): ModifierConfig[] => {
  return modifiers.filter(isModifier);
};

export * from './animation/index';
export * from './containerShape';
