/**
 * Core modifier factory and type definitions for SwiftUI view modifiers.
 * This system allows both built-in and 3rd party modifiers to use the same API.
 */

import { requireNativeModule } from 'expo';

import { animation } from './animation/index';
import { background } from './background';
import { containerShape } from './containerShape';
import { contentShape } from './contentShape';
import { createModifier, createModifierWithEventListener, ModifierConfig } from './createModifier';
import { datePickerStyle } from './datePickerStyle';
import { environment } from './environment';
import { gaugeStyle } from './gaugeStyle';
import { progressViewStyle } from './progressViewStyle';
import type { Color } from './types';

const ExpoUI = requireNativeModule('ExpoUI');

// =============================================================================
// Built-in Modifier Functions
// =============================================================================

/**
 * Sets the spacing between adjacent sections.
 * @param spacing - The spacing to apply.
 * @platform ios 17.0+
 */
export const listSectionSpacing = (spacing: 'default' | 'compact' | number) => {
  if (typeof spacing === 'number') {
    return createModifier('listSectionSpacing', {
      spacing: 'custom',
      value: spacing,
    });
  }

  return createModifier('listSectionSpacing', { spacing });
};

/**
 * Applies corner radius to a view.
 * @param radius - The corner radius value.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/cornerradius(_:antialiased:)).
 */
export const cornerRadius = (radius: number) => createModifier('cornerRadius', { radius });

/**
 * Adds a shadow to a view.
 * @param params - The shadow parameters: `radius`, offset (`x`, `y`) and `color`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/shadow(color:radius:x:y:)).
 */
export const shadow = (params: { radius: number; x?: number; y?: number; color?: Color }) =>
  createModifier('shadow', params);

/**
 * Adds a matched geometry effect to a view.
 * @param id - The id of the view.
 * @param namespaceId - The namespace id of the view. Use Namespace component to create a namespace.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)).
 */
export const matchedGeometryEffect = (id: string, namespaceId: string) =>
  createModifier('matchedGeometryEffect', { id, namespaceId });

/**
 * Sets the frame properties of a view.
 * @param params - The frame parameters. Width, height, minWidth, maxWidth, minHeight, maxHeight, idealWidth, idealHeight and alignment.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/frame(width:height:alignment:)).
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
 * Positions this view within an invisible frame with a size relative to the nearest container.
 * @param params - The content relative frame parameters: `axes`, `count`, `span`, `spacing` and `alignment`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/containerRelativeFrame(_:alignment:)).
 * @platform ios 17.0+
 * @platform tvos 17.0+
 */
export const containerRelativeFrame = (params: {
  axes: 'horizontal' | 'vertical' | 'both';
  count?: number;
  span?: number;
  spacing?: number;
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
}) => createModifier('containerRelativeFrame', params);

/**
 * Sets padding on a view.
 * Supports individual edges or shorthand properties.
 * @param params - The padding parameters: `top`, `bottom`, `leading`, `trailing`, `horizontal`, `vertical` and `all`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/padding(_:_:)).
 */
export const padding = (params?: {
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
 * @param params - Whether the view should use its ideal width or height.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/fixedsize()).
 */
export const fixedSize = (params?: { horizontal?: boolean; vertical?: boolean }) =>
  createModifier('fixedSize', params);

/**
 * Allows a view to ignore safe area constraints.
 * @param params - The safe area regions to ignore and the edges to expand into.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/ignoressafearea(_:edges:)).
 */
export const ignoreSafeArea = (params?: {
  regions?: 'all' | 'container' | 'keyboard';
  edges?: 'all' | 'top' | 'bottom' | 'leading' | 'trailing' | 'horizontal' | 'vertical';
}) => createModifier('ignoreSafeArea', params);

/**
 * Adds a tap gesture recognizer.
 * @param handler - Function to call when tapped.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/ontapgesture(count:perform:)).
 */
export const onTapGesture = (handler: () => void) =>
  createModifierWithEventListener('onTapGesture', handler);

/**
 * Adds a long press gesture recognizer.
 * @param handler - Function to call when long pressed.
 * @param minimumDuration - Minimum duration for long press (default: 0.5s)
 */
export const onLongPressGesture = (handler: () => void, minimumDuration?: number) =>
  createModifierWithEventListener('onLongPressGesture', handler, {
    minimumDuration: minimumDuration ?? 0.5,
  });

/**
 * Adds an onAppear modifier that calls a function when the view appears.
 * @param handler - Function to call when the view appears.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/onlongpressgesture(minimumduration:perform:onpressingchanged:)).
 */
export const onAppear = (handler: () => void) =>
  createModifierWithEventListener('onAppear', handler);

/**
 * Adds an onDisappear modifier that calls a function when the view disappears.
 * @param handler - Function to call when the view disappears.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/ondisappear(perform:)).
 */
export const onDisappear = (handler: () => void) =>
  createModifierWithEventListener('onDisappear', handler);

/**
 * Marks a view as refreshable. Adds pull-to-refresh functionality.
 * @param handler - Async function to call when refresh is triggered.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/refreshable(action:)).
 */
export const refreshable = (handler: () => Promise<void>) =>
  createModifierWithEventListener('refreshable', async (args: { id: string }) => {
    try {
      await handler();
    } finally {
      await ExpoUI.completeRefresh(args.id);
    }
  });

// Note: Complex gesture modifiers like onDragGesture are not available
// in the modifier system. Use component-level props instead.

/**
 * Sets the opacity of a view.
 * @param value - Opacity value between 0 and 1.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/opacity(_:)).
 */
export const opacity = (value: number) => createModifier('opacity', { value });

/**
 * Clips the view to a specific shape.
 * @param shape - The clipping shape.
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/clipshape(_:style:)).
 */
export const clipShape = (
  shape: 'rectangle' | 'circle' | 'capsule' | 'ellipse' | 'roundedRectangle',
  cornerRadius?: number
) => createModifier('clipShape', { shape, cornerRadius });

/**
 * Adds a border to a view.
 * @param params - The border parameters. Color and width.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/border(_:width:)).
 */
export const border = (params: { color: Color; width?: number }) =>
  createModifier('border', params);

/**
 * Applies scaling transformation.
 * @param scale - Uniform scale factor (1.0 = normal size), or an object with separate `x` and `y` scale factors.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/scaleeffect(_:anchor:)).
 */
export const scaleEffect = (scale: number | { x: number; y: number }) =>
  createModifier('scaleEffect', typeof scale === 'number' ? { x: scale, y: scale } : scale);

/**
 * Applies rotation transformation.
 * @param angle - Rotation angle in degrees.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/rotationeffect(_:anchor:)).
 */
export const rotationEffect = (angle: number) => createModifier('rotationEffect', { angle });

/**
 * Applies an offset (translation) to a view.
 * @param params - The offset parameters: `x` and `y`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/offset(x:y:)).
 */
export const offset = (params: { x?: number; y?: number }) => createModifier('offset', params);

/**
 * Sets the foreground color/tint of a view.
 * @param color - The foreground color (hex string).
 * @deprecated Use `foregroundStyle` instead.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/foregroundcolor(_:)).
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
 * - Named colors: `'red'`, `'blue'`, `'green'`, and so on.
 *
 * **Explicit Color Object:**
 * ```ts
 * { type: 'color', color: '#FF0000' }
 * ```
 *
 * **Hierarchical Styles (Semantic):**
 * Auto-adapting semantic styles that respond to light/dark mode and accessibility settings:
 * ```ts
 * { type: 'hierarchical', style: 'primary' }    // Most prominent (main content, headlines)
 * { type: 'hierarchical', style: 'secondary' }  // Supporting text, subheadlines
 * { type: 'hierarchical', style: 'tertiary' }   // Less important text, captions
 * { type: 'hierarchical', style: 'quaternary' } // Subtle text, disabled states
 * { type: 'hierarchical', style: 'quinary' }    // Most subtle (iOS 16+, fallback to quaternary)
 * ```
 *
 * **Linear Gradient:**
 * ```ts
 * {
 *   type: 'linearGradient',
 *   colors: ['#FF0000', '#0000FF', '#00FF00'],
 *   startPoint: { x: 0, y: 0 },    // Top-left
 *   endPoint: { x: 1, y: 1 }       // Bottom-right
 * }
 * ```
 *
 * **Radial Gradient:**
 * ```ts
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
 * ```ts
 * {
 *   type: 'angularGradient',
 *   colors: ['#FF0000', '#00FF00', '#0000FF'],
 *   center: { x: 0.5, y: 0.5 }     // Rotation center
 * }
 * ```
 *
 * @example
 * ```tsx
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
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/foregroundstyle(_:)).
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
  if (style.type === 'hierarchical') {
    return createModifier('foregroundStyle', {
      styleType: 'hierarchical',
      hierarchicalStyle: style.style,
    });
  }
  const { type, ...rest } = style;
  return createModifier('foregroundStyle', { styleType: type, ...rest });
};

/**
 * Makes text bold.
 * When applied to `Text`, it works on all iOS/tvOS versions. When used on regular views, it requires iOS 16.0+/tvOS 16.0+.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/text/bold()).
 */
export const bold = () => createModifier('bold', {});

/**
 * Makes text italic.
 * When applied to `Text`, it works on all iOS/tvOS versions. When used on regular views, it requires iOS 16.0+/tvOS 16.0+.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/text/italic()).
 */
export const italic = () => createModifier('italic', {});

/**
 * Sets the tint color of a view.
 * @param color - The tint color (hex string). For example, `#FF0000`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/tint(_:)).
 */
export const tint = (color: Color) => createModifier('tint', { color });

/**
 * Hides or shows a view.
 * @param hidden - Whether the view should be hidden.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/hidden(_:)).
 */
export const hidden = (hidden: boolean = true) => createModifier('hidden', { hidden });

/**
 * Disables or enables a view.
 * @param disabled - Whether the view should be disabled.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/disabled(_:)).
 */
export const disabled = (disabled: boolean = true) => createModifier('disabled', { disabled });

/**
 * Sets the z-index (display order) of a view.
 * @param index - The z-index value.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/zindex(_:)).
 */
export const zIndex = (index: number) => createModifier('zIndex', { index });

/**
 * Applies blur to a view.
 * @param radius - The blur radius.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/blur(radius:opaque:)).
 */
export const blur = (radius: number) => createModifier('blur', { radius });

/**
 * Adjusts the brightness of a view.
 * @param amount - Brightness adjustment (-1 to 1).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/brightness(_:)).
 */
export const brightness = (amount: number) => createModifier('brightness', { amount });

/**
 * Adjusts the contrast of a view.
 * @param amount - Contrast multiplier (0 to infinity, 1 = normal).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/contrast(_:)).
 */
export const contrast = (amount: number) => createModifier('contrast', { amount });

/**
 * Adjusts the saturation of a view.
 * @param amount - Saturation multiplier (0 to infinity, 1 = normal).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/saturation(_:)).
 */
export const saturation = (amount: number) => createModifier('saturation', { amount });

/**
 * Applies a hue rotation to a view.
 * @param angle - Hue rotation angle in degrees.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/huerotation(_:)).
 */
export const hueRotation = (angle: number) => createModifier('hueRotation', { angle });

/**
 * Inverts the colors of a view.
 * @param inverted - Whether to invert colors.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/colorinvert()).
 */
export const colorInvert = (inverted: boolean = true) =>
  createModifier('colorInvert', { inverted });

/**
 * Makes a view grayscale.
 * @param amount - Grayscale amount (0 to 1).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/grayscale(_:)).
 */
export const grayscale = (amount: number) => createModifier('grayscale', { amount });

/**
 * Sets the button style for button views.
 * @param style - The button style.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/buttonstyle(_:)).
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
 * Sets the style for toggles within this view.
 * @param style - The toggle style.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/togglestyle(_:)).
 */
export const toggleStyle = (style: 'automatic' | 'switch' | 'button') =>
  createModifier('toggleStyle', { style });

/**
 * Sets the size of controls within this view.
 * @param size - The control size.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/controlsize(_:)).
 */
export const controlSize = (size: 'mini' | 'small' | 'regular' | 'large' | 'extraLarge') =>
  createModifier('controlSize', { size });

/**
 * Sets the style for labels within this view.
 * @param style - The label style.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/labelstyle(_:)).
 */
export const labelStyle = (style: 'automatic' | 'iconOnly' | 'titleAndIcon' | 'titleOnly') =>
  createModifier('labelStyle', { style });

/**
 * Hides the labels of any controls contained within this view.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/labelshidden()).
 */
export const labelsHidden = () => createModifier('labelsHidden', {});

/**
 * Sets the text field style for text field views.
 * @param style - The text field style.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/textfieldstyle(_:)).
 */
export const textFieldStyle = (style: 'automatic' | 'plain' | 'roundedBorder') =>
  createModifier('textFieldStyle', { style });

/**
 * Controls how the keyboard is dismissed when scrolling.
 * @param mode - The keyboard dismiss mode.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/scrolldismisseskeyboard(_:)).
 */
export const scrollDismissesKeyboard = (
  mode: 'automatic' | 'never' | 'interactively' | 'immediately'
) => createModifier('scrollDismissesKeyboard', { mode });

/**
 * Disables or enables scrolling in scrollable views.
 * @param disabled - Whether scrolling should be disabled (default: true).
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/scrolldisabled(_:)).
 */
export const scrollDisabled = (disabled: boolean = true) =>
  createModifier('scrollDisabled', { disabled });

/**
 * Disables the move action for a view in a list.
 * Apply to items within a `ForEach` to prevent them from being moved.
 * @param disabled - Whether moving should be disabled
 * @default true
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/movedisabled(_:)).
 */
export const moveDisabled = (disabled: boolean = true) =>
  createModifier('moveDisabled', { disabled });

/**
 * Disables the delete action for a view in a list.
 * Apply to items within a `ForEach` to prevent them from being deleted.
 * @param disabled - Whether deletion should be disabled
 * @default true
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/deletedisabled(_:)).
 */
export const deleteDisabled = (disabled: boolean = true) =>
  createModifier('deleteDisabled', { disabled });

/**
 * Controls the dismissal behavior of menu actions.
 * @param behavior - The menu action dismiss behavior.
 * @platform ios 16.4+
 * @platform tvos 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/menuactiondismissbehavior(_:)).
 */
export const menuActionDismissBehavior = (behavior: 'automatic' | 'disabled' | 'enabled') =>
  createModifier('menuActionDismissBehavior', { behavior });

/**
 * Sets accessibility label for the view.
 * @param label - The accessibility label.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/accessibilitylabel(_:)).
 */
export const accessibilityLabel = (label: string) =>
  createModifier('accessibilityLabel', { label });

/**
 * Sets accessibility hint for the view.
 * @param hint - The accessibility hint.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/accessibilityhint(_:)).
 */
export const accessibilityHint = (hint: string) => createModifier('accessibilityHint', { hint });

/**
 * Sets accessibility value for the view.
 * @param value - The accessibility value.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/accessibilityvalue(_:)).
 */
export const accessibilityValue = (value: string) =>
  createModifier('accessibilityValue', { value });

/**
 * Sets layout priority for the view.
 * @param priority - Layout priority value.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/layoutpriority(_:)).
 */
export const layoutPriority = (priority: number) => createModifier('layoutPriority', { priority });

/**
 * Applies a mask to the view.
 * @param shape - The masking shape.
 * @param cornerRadius - Corner radius for rounded rectangle (default: `8`).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/mask(_:)).
 */
export const mask = (
  shape: 'rectangle' | 'circle' | 'capsule' | 'ellipse' | 'roundedRectangle',
  cornerRadius?: number
) => createModifier('mask', { shape, cornerRadius });

/**
 * Overlays another view on top.
 * @param params - Overlay color and alignment.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/overlay(_:alignment:)).
 */
export const overlay = (params: {
  color?: Color;
  alignment?: 'center' | 'top' | 'bottom' | 'leading' | 'trailing';
}) => createModifier('overlay', params);

/**
 * Adds a background behind the view.
 * @param params - Background color and alignment.
 */
export const backgroundOverlay = (params: {
  color?: Color;
  alignment?: 'center' | 'top' | 'bottom' | 'leading' | 'trailing';
}) => createModifier('backgroundOverlay', params);

/**
 * Sets aspect ratio constraint.
 * @param params - Width/height aspect ratio and content mode.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/aspectratio(_:contentmode:)).
 */
export const aspectRatio = (params: { ratio: number; contentMode?: 'fit' | 'fill' }) =>
  createModifier('aspectRatio', params);

/**
 * Clips content to bounds.
 * @param clipped - Whether to clip content.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/clipped(antialiased:)).
 */
export const clipped = (clipped: boolean = true) => createModifier('clipped', { clipped });

/**
 * Applies a glass effect to a view.
 * @param params - The glass effect parameters. Variant, interactive, tint and shape.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)).
 */
export const glassEffect = (params?: {
  glass?: {
    variant: 'regular' | 'clear' | 'identity';
    interactive?: boolean;
    tint?: Color;
  };
  shape?: 'circle' | 'capsule' | 'rectangle' | 'ellipse' | 'roundedRectangle';
  cornerRadius?: number;
}) => createModifier('glassEffect', params);

/**
 * Associates an identity value to Liquid Glass effects defined within a `GlassEffectContainer`.
 * @param id - The id of the glass effect.
 * @param namespaceId - The namespace id of the glass effect. Use Namespace component to create a namespace.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/glasseffectid(_:in:)).
 */
export const glassEffectId = (id: string, namespaceId: string) =>
  createModifier('glassEffectId', {
    id,
    namespaceId,
  });

/**
 * Specifies the visibility of the background for scrollable views within this view.
 * @param visible - The visibility of the background.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/scrollcontentbackground(_:)).
 */
export const scrollContentBackground = (visible: 'automatic' | 'visible' | 'hidden') =>
  createModifier('scrollContentBackground', { visible });

/**
 * Sets the background of a row.
 * @param color - The row color (hex string). For example, `#FF0000`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/listrowbackground(_:)).
 */
export const listRowBackground = (color: Color) => createModifier('listRowBackground', { color });

/**
 * Controls the visibility of the separator for a list row.
 * @param visibility - The visibility to apply.
 * @param edges - The edges where the separator visibility applies.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/listrowseparator(_:edges:)).
 */
export const listRowSeparator = (
  visibility: 'automatic' | 'visible' | 'hidden',
  edges?: 'all' | 'top' | 'bottom'
) => createModifier('listRowSeparator', { visibility, edges });

/**
 * Sets the truncation mode for lines of text that are too long to fit in the available space.
 * @param mode - The truncation mode that specifies where to truncate the text within the text view, if needed.
 * You can truncate at the beginning, middle, or end of the text view.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/truncationmode(_:)).
 */
export const truncationMode = (mode: 'head' | 'middle' | 'tail') =>
  createModifier('truncationMode', { mode });
/**
 * Sets whether text in this view can compress the space between characters when necessary to fit text in a line
 * @default true
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/allowstightening(_:)).
 */
export const allowsTightening = (value: boolean) => createModifier('allowsTightening', { value });
/**
 * Sets the spacing, or kerning, between characters for the text in this view.
 * @default 0
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/kerning(_:)).
 */
export const kerning = (value?: number) => createModifier('kerning', { value });
/**
 * Sets a transform for the case of the text contained in this view when displayed.
 * @default "lowercase"
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/textcase(_:)).
 */
export const textCase = (value: 'lowercase' | 'uppercase') => createModifier('textCase', { value });

type LinePattern = 'solid' | 'dash' | 'dot' | 'dashDot' | 'dashDotDot';

/**
 * Applies an underline to the text.
 *
 * @param params - Controls whether the underline is visible (`true` to show, `false` to hide).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/underline(_:pattern:color:)).
 */
export const underline = (params: { isActive: boolean; pattern: LinePattern; color?: Color }) =>
  createModifier('underline', params);
/**
 * Applies a strikethrough to the text.
 *
 * @param params - Controls whether the strikethrough is visible (`true` to show, `false` to hide).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/text/strikethrough(_:color:)).
 */
export const strikethrough = (params: { isActive: boolean; pattern: LinePattern; color?: Color }) =>
  createModifier('strikethrough', params);

/**
 * An alignment position for text along the horizontal axis.
 *
 * @param alignment - A value that you use to align multiple lines of text within a view.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/multilinetextalignment(_:)).
 */
export const multilineTextAlignment = (alignment: 'center' | 'leading' | 'trailing') =>
  createModifier('multilineTextAlignment', { alignment });

/**
 * Controls whether people can select text within this view.
 * @param value - Enable selection
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/textselection(_:)).
 */
export const textSelection = (value: boolean) => createModifier('textSelection', { value });
/**
 * The distance in points between the bottom of one line fragment and the top of the next.
 * @param value - The amount of space between the bottom of one line and the top of the next line in points. This value is always nonnegative. Otherwise, the default value will be used.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/linespacing(_:)).
 */
export const lineSpacing = (value: number) => createModifier('lineSpacing', { value });
/**
 * Sets the maximum number of lines that text can occupy in the view.
 * @param limit - The maximum number of lines.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/linelimit(_:)).
 */
export const lineLimit = (limit?: number) => createModifier('lineLimit', { limit });
/**
 * Sets the header prominence for this view.
 * @param prominence - The prominence to apply.
 */
export const headerProminence = (prominence: 'standard' | 'increased') =>
  createModifier('headerProminence', { prominence });
/**
 * Applies an inset to the rows in a list.
 * @param params - The inset to apply to the rows in a list.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/listrowinsets(_:)).
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
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/badgeprominence(_:)).
 */
export const badgeProminence = (badgeType: 'standard' | 'increased' | 'decreased') =>
  createModifier('badgeProminence', { badgeType });
/**
 * Generates a badge for the view from a localized string key.
 * @param value - Text view to display as a badge. Set the value to nil to hide the badge.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/badge(_:)).
 */
export const badge = (value?: string) => createModifier('badge', { value });
/**
 * Allows a view to ignore safe area constraints.
 * @platform iOS 26+
 * @param params - The margins to apply to the section in a list.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/listsectionmargins(_:_:)).
 */
export const listSectionMargins = (params?: {
  length?: number;
  edges?: 'all' | 'top' | 'bottom' | 'leading' | 'trailing' | 'horizontal' | 'vertical';
}) => createModifier('listSectionMargins', params);

/**
 * Sets the font properties of a view.
 * Supports both custom font families and system fonts with weight and design options.
 *
 * @param params - The font configuration. When `family` is provided, it uses Font.custom().
 * When `family` is not provided, it uses Font.system() with the specified weight and design.
 *
 * @example
 * ```tsx
 * // Custom font family
 * <Text modifiers={[font({ family: 'Helvetica', size: 18 })]}>Custom Font Text</Text>
 *
 * // System font with weight and design
 * <Text modifiers={[font({ weight: 'bold', design: 'rounded', size: 16 })]}>System Font Text</Text>
 * ```
 * @see Official [SwiftUI documentation for `custom(_:size:)`](https://developer.apple.com/documentation/swiftui/font/custom(_:size:)) and Official [SwiftUI documentation for `system(size:weight:design:)`](https://developer.apple.com/documentation/swiftui/font/system(size:weight:design:)).
 */
export const font = (params: {
  /**
   * Custom font family name.
   * If provided, uses `Font.custom()`.
   */
  family?: string;
  /** Font size in points. */
  size?: number;
  /** Font weight for system fonts. */
  weight?:
    | 'ultraLight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
  /** Font design for system fonts */
  design?: 'default' | 'rounded' | 'serif' | 'monospaced';
}) => createModifier('font', params);
/**
 * Asks grid layouts not to offer the view extra size in the specified axes.
 * @param axes - The dimensions in which the grid shouldn’t offer the view a share of any available space. This prevents a flexible view like a Spacer, Divider, or Color from defining the size of a row or column.
 * @returns A view that doesn’t ask an enclosing grid for extra size in one or more axes.
 */
export const gridCellUnsizedAxes = (axes?: 'horizontal' | 'vertical') =>
  createModifier('gridCellUnsizedAxes', { axes });
/**
 * Tells a view that acts as a cell in a grid to span the specified number of columns.
 * @param count - The number of columns that the view should consume when placed in a grid row.
 * @returns A view that occupies the specified number of columns in a grid row.
 */
export const gridCellColumns = (count?: number) => createModifier('gridCellColumns', { count });
/**
 * Overrides the default horizontal alignment of the grid column that the view appears in.
 * @param alignment - The HorizontalAlignment guide to use for the grid column that the view appears in.
 * @returns A view that uses the specified horizontal alignment, and that causes all cells in the same column of a grid to use the same alignment.
 * @platform iOS 16+
 */
export const gridColumnAlignment = (alignment?: 'leading' | 'center' | 'trailing') =>
  createModifier('gridColumnAlignment', { alignment });
/**
 * Specifies a custom alignment anchor for a view that acts as a grid cell.
 * @param anchor - The unit point that defines how to align the view within the bounds of its grid cell.
 * @returns A view that uses the specified anchor point to align its content.
 * @platform iOS 16+
 *
 * @example
 * ```tsx
 * // Using a preset anchor
 * <Rectangle
 *   modifiers={[
 *     gridCellAnchor({ type: 'preset', anchor: 'center' }),
 *   ]}
 * />
 *
 * // Using a custom anchor point
 * <Rectangle
 *   modifiers={[
 *     gridCellAnchor({ type: 'custom', points: { x: 0.3, y: 0.8 } }),
 *   ]}
 * />
 * ```
 */
export const gridCellAnchor = (
  anchor:
    | {
        type: 'preset';
        anchor:
          | 'zero'
          | 'leading'
          | 'center'
          | 'trailing'
          | 'topLeading'
          | 'top'
          | 'topTrailing'
          | 'bottomLeading'
          | 'bottom'
          | 'bottomTrailing';
      }
    | { type: 'custom'; points: { x: number; y: number } }
) => createModifier('gridCellAnchor', anchor);
/**
 * Specifies the label to display in the keyboard's return key. For example, `'done'`.
 * @param submitLabel - The label to display in the keyboard's return key.
 * @returns A view that uses the specified submit label.
 * @platform iOS 15+
 *
 * @example
 * ```tsx
 * <TextField
 *   modifiers={[
 *     submitLabel('search'),
 *   ]}
 * />
 * ```
 */
export const submitLabel = (
  submitLabel: 'continue' | 'done' | 'go' | 'join' | 'next' | 'return' | 'route' | 'search' | 'send'
) => createModifier('submitLabel', { submitLabel });

/**
 * Sets the content transition type for a view.
 * Useful for animating changes in text content, especially numeric text.
 * Use with the [`animation`](#animationanimationobject-animatedvalue) modifier to animate the transition when the content changes.
 *
 * @param transitionType - The type of content transition.
 * @param params - Optional parameters.
 * @param params.countsDown - Whether the numeric text counts down.
 *
 * @example
 * ```tsx
 * <Text modifiers={[contentTransition('numericText'), animation(Animation.default, count)]}>
 *   {count.toString()}
 * </Text>
 * ```
 *
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/contenttransition(_:)).
 */
export const contentTransition = (
  transitionType: 'numericText' | 'identity' | 'opacity' | 'interpolate',
  params?: { countsDown?: boolean }
) =>
  createModifier('contentTransition', {
    transitionType,
    countsDown: params?.countsDown,
  });

export type ListStyle = 'automatic' | 'plain' | 'inset' | 'insetGrouped' | 'grouped' | 'sidebar';
/**
 * Sets the style for a List view.
 * @param style - The list style to apply.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/liststyle(_:)).
 */
export const listStyle = (style: ListStyle) => createModifier('listStyle', { style });

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Union type of all built-in modifier return types.
 * This provides type safety for the modifiers array.
 * @hidden
 */
export type BuiltInModifier =
  | ReturnType<typeof listSectionSpacing>
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
  | ReturnType<typeof bold>
  | ReturnType<typeof italic>
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
  | ReturnType<typeof toggleStyle>
  | ReturnType<typeof controlSize>
  | ReturnType<typeof labelStyle>
  | ReturnType<typeof labelsHidden>
  | ReturnType<typeof textFieldStyle>
  | ReturnType<typeof menuActionDismissBehavior>
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
  | ReturnType<typeof contentShape>
  | ReturnType<typeof containerRelativeFrame>
  | ReturnType<typeof scrollContentBackground>
  | ReturnType<typeof scrollDisabled>
  | ReturnType<typeof moveDisabled>
  | ReturnType<typeof deleteDisabled>
  | ReturnType<typeof environment>
  | ReturnType<typeof listRowBackground>
  | ReturnType<typeof listRowSeparator>
  | ReturnType<typeof truncationMode>
  | ReturnType<typeof allowsTightening>
  | ReturnType<typeof kerning>
  | ReturnType<typeof textCase>
  | ReturnType<typeof underline>
  | ReturnType<typeof strikethrough>
  | ReturnType<typeof multilineTextAlignment>
  | ReturnType<typeof textSelection>
  | ReturnType<typeof lineSpacing>
  | ReturnType<typeof lineLimit>
  | ReturnType<typeof headerProminence>
  | ReturnType<typeof listRowInsets>
  | ReturnType<typeof badgeProminence>
  | ReturnType<typeof badge>
  | ReturnType<typeof listSectionMargins>
  | ReturnType<typeof font>
  | ReturnType<typeof gridCellUnsizedAxes>
  | ReturnType<typeof gridCellColumns>
  | ReturnType<typeof gridColumnAlignment>
  | ReturnType<typeof gridCellAnchor>
  | ReturnType<typeof submitLabel>
  | ReturnType<typeof datePickerStyle>
  | ReturnType<typeof progressViewStyle>
  | ReturnType<typeof gaugeStyle>
  | ReturnType<typeof listStyle>
  | ReturnType<typeof contentTransition>;

/**
 * Main ViewModifier type that supports both built-in and 3rd party modifiers.
 * 3rd party modifiers should return ModifierConfig objects with their own type strings.
 * @hidden
 */
export type ViewModifier = BuiltInModifier | ModifierConfig;

// =============================================================================
// Utility Functions
// =============================================================================

export * from './createModifier';
export * from './utils';

/**
 * Type guard to check if a value is a valid modifier.
 * @hidden
 */
export const isModifier = (value: any): value is ModifierConfig => {
  return typeof value === 'object' && value !== null && typeof value.$type === 'string';
};

/**
 * Filters an array to only include valid modifiers.
 * @hidden
 */
export const filterModifiers = (modifiers: unknown[]): ModifierConfig[] => {
  return modifiers.filter(isModifier);
};

export * from './animation/index';
export * from './containerShape';
export * from './contentShape';
export * from './shapes/index';
export * from './background';
export type * from './types';
export * from './tag';
export * from './pickerStyle';
export * from './datePickerStyle';
export * from './progressViewStyle';
export * from './gaugeStyle';
export * from './presentationModifiers';
export * from './environment';
export type {
  TimingAnimationParams,
  SpringAnimationParams,
  InterpolatingSpringAnimationParams,
  ChainableAnimationType,
} from './animation/types';
