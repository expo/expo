/**
 * Core modifier factory and type definitions for SwiftUI view modifiers.
 * This system allows both built-in and 3rd party modifiers to use the same API.
 */
/**
 * Factory function to create modifier configuration objects.
 * This is used internally by all modifier functions.
 */
function createModifier(type, params = {}) {
    return { $type: type, ...params };
}
/**
 * Creates a modifier with an event listener.
 */
function createModifierWithEventListener(type, eventListener, params = {}) {
    return { $type: type, ...params, eventListener };
}
// =============================================================================
// Built-in Modifier Functions
// =============================================================================
/**
 * Sets the background of a view.
 * @param color - The background color (hex string, e.g., '#FF0000')
 */
export const background = (color) => createModifier('background', { color });
/**
 * Applies corner radius to a view.
 * @param radius - The corner radius value
 */
export const cornerRadius = (radius) => createModifier('cornerRadius', { radius });
/**
 * Adds a shadow to a view.
 */
export const shadow = (params) => createModifier('shadow', params);
/**
 * Sets the frame properties of a view.
 */
export const frame = (params) => createModifier('frame', params);
/**
 * Sets padding on a view.
 * Supports individual edges or shorthand properties.
 */
export const padding = (params) => createModifier('padding', params);
/**
 * Controls fixed size behavior.
 * @param enabled - Whether the view should use its natural size
 */
export const fixedSize = (enabled = true) => createModifier('fixedSize', { enabled });
/**
 * Adds a tap gesture recognizer.
 * @param handler - Function to call when tapped
 */
export const onTapGesture = (handler) => createModifierWithEventListener('onTapGesture', handler);
/**
 * Adds a long press gesture recognizer.
 * @param handler - Function to call when long pressed
 * @param minimumDuration - Minimum duration for long press (default: 0.5s)
 */
export const onLongPressGesture = (handler, minimumDuration) => createModifierWithEventListener('onLongPressGesture', handler, {
    minimumDuration: minimumDuration ?? 0.5,
});
// Note: Complex gesture modifiers like onDragGesture are not available
// in the modifier system. Use component-level props instead.
/**
 * Sets the opacity of a view.
 * @param value - Opacity value between 0 and 1
 */
export const opacity = (value) => createModifier('opacity', { value });
/**
 * Clips the view to a specific shape.
 * @param shape - The clipping shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 */
export const clipShape = (shape, cornerRadius) => createModifier('clipShape', { shape, cornerRadius });
/**
 * Adds a border to a view.
 */
export const border = (params) => createModifier('border', params);
/**
 * Applies scaling transformation.
 * @param scale - Scale factor (1.0 = normal size)
 */
export const scaleEffect = (scale) => createModifier('scaleEffect', { scale });
/**
 * Applies rotation transformation.
 * @param angle - Rotation angle in degrees
 */
export const rotationEffect = (angle) => createModifier('rotationEffect', { angle });
/**
 * Applies an offset (translation) to a view.
 */
export const offset = (params) => createModifier('offset', params);
/**
 * Sets the foreground color/tint of a view.
 * @param color - The foreground color (hex string)
 */
export const foregroundColor = (color) => createModifier('foregroundColor', { color });
/**
 * Sets the tint color of a view.
 * @param color - The tint color (hex string)
 */
export const tint = (color) => createModifier('tint', { color });
/**
 * Hides or shows a view.
 * @param hidden - Whether the view should be hidden
 */
export const hidden = (hidden = true) => createModifier('hidden', { hidden });
/**
 * Sets the z-index (display order) of a view.
 * @param index - The z-index value
 */
export const zIndex = (index) => createModifier('zIndex', { index });
/**
 * Applies blur to a view.
 * @param radius - The blur radius
 */
export const blur = (radius) => createModifier('blur', { radius });
/**
 * Adjusts the brightness of a view.
 * @param amount - Brightness adjustment (-1 to 1)
 */
export const brightness = (amount) => createModifier('brightness', { amount });
/**
 * Adjusts the contrast of a view.
 * @param amount - Contrast multiplier (0 to infinity, 1 = normal)
 */
export const contrast = (amount) => createModifier('contrast', { amount });
/**
 * Adjusts the saturation of a view.
 * @param amount - Saturation multiplier (0 to infinity, 1 = normal)
 */
export const saturation = (amount) => createModifier('saturation', { amount });
/**
 * Applies a hue rotation to a view.
 * @param angle - Hue rotation angle in degrees
 */
export const hueRotation = (angle) => createModifier('hueRotation', { angle });
/**
 * Inverts the colors of a view.
 * @param inverted - Whether to invert colors
 */
export const colorInvert = (inverted = true) => createModifier('colorInvert', { inverted });
/**
 * Makes a view grayscale.
 * @param amount - Grayscale amount (0 to 1)
 */
export const grayscale = (amount) => createModifier('grayscale', { amount });
/**
 * Sets accessibility label for the view.
 * @param label - The accessibility label
 */
export const accessibilityLabel = (label) => createModifier('accessibilityLabel', { label });
/**
 * Sets accessibility hint for the view.
 * @param hint - The accessibility hint
 */
export const accessibilityHint = (hint) => createModifier('accessibilityHint', { hint });
/**
 * Sets accessibility value for the view.
 * @param value - The accessibility value
 */
export const accessibilityValue = (value) => createModifier('accessibilityValue', { value });
/**
 * Sets layout priority for the view.
 * @param priority - Layout priority value
 */
export const layoutPriority = (priority) => createModifier('layoutPriority', { priority });
/**
 * Applies a mask to the view.
 * @param shape - The masking shape
 * @param cornerRadius - Corner radius for rounded rectangle (default: 8)
 */
export const mask = (shape, cornerRadius) => createModifier('mask', { shape, cornerRadius });
/**
 * Overlays another view on top.
 * @param color - Overlay color
 * @param alignment - Overlay alignment
 */
export const overlay = (params) => createModifier('overlay', params);
/**
 * Adds a background behind the view.
 * @param color - Background color
 * @param alignment - Background alignment
 */
export const backgroundOverlay = (params) => createModifier('backgroundOverlay', params);
/**
 * Sets aspect ratio constraint.
 * @param ratio - Width/height aspect ratio
 * @param contentMode - How content fits the aspect ratio
 */
export const aspectRatio = (params) => createModifier('aspectRatio', params);
/**
 * Clips content to bounds.
 * @param clipped - Whether to clip content
 */
export const clipped = (clipped = true) => createModifier('clipped', { clipped });
/**
 * Applies a glass effect to a view.
 */
export const glassEffect = (params) => createModifier('glassEffect', params);
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
export const isModifier = (value) => {
    return typeof value === 'object' && value !== null && typeof value.$type === 'string';
};
/**
 * Filters an array to only include valid modifiers.
 */
export const filterModifiers = (modifiers) => {
    return modifiers.filter(isModifier);
};
//# sourceMappingURL=index.js.map