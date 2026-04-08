import { createModifier } from './createModifier';

/**
 * Specifies the how to render an Image when using the WidgetKit/WidgetRenderingMode/accented mode.
 * @param renderingMode - A constant describing how the Image should be rendered.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/image/widgetaccentedrenderingmode(_:)).
 */
export const widgetAccentedRenderingMode = (
  renderingMode: 'fullColor' | 'accented' | 'desaturated' | 'accentedDesaturated'
) => createModifier('widgetAccentedRenderingMode', { renderingMode });

/**
 * Sets the URL to open in the containing app when the user clicks the widget.
 * Widgets support one widgetURL modifier in their view hierarchy. If multiple views have widgetURL modifiers, the behavior is undefined.
 * @param url - The URL to open in the containing app.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/widgetURL(_:)).
 */
export const widgetURL = (url: string) => createModifier('widgetURL', { url });

/**
 * Sets a container background color for a widget or live activity.
 * Use this to set the background style of a widget or the expanded area of a live activity.
 * Applies to the `.widget` container background placement.
 * @param color - The background color.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/containerbackground(_:for:)).
 */
export const containerBackground = (color: string) =>
  createModifier('containerBackground', { color });

/**
 * Marks the content of a widget or live activity as invalidatable,
 * allowing the system to apply visual effects when the content is stale.
 * @param isInvalidatable - Whether the content should be marked as invalidatable.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/invalidatablecontent(_:)).
 */
export const invalidatableContent = (isInvalidatable: boolean = true) =>
  createModifier('invalidatableContent', { isInvalidatable });

/**
 * Disables the default content margins for a widget.
 * Allows widget content to extend to the edges of the widget.
 * @param disabled - Whether to disable content margins. Defaults to `true`.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/widgetkit/widgetconfiguration/contentmarginsdisabled(_:)).
 */
export const contentMarginsDisabled = (disabled: boolean = true) =>
  createModifier('contentMarginsDisabled', { disabled });

/**
 * Prevents a view from being redacted when the widget is in a placeholder state.
 * Useful for content that should always be visible even during redaction (e.g., icons, static labels).
 * @platform ios 15.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/unredacted()).
 */
export const unredacted = () => createModifier('unredacted', {});
