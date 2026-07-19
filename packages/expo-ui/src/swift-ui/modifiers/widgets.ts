import { createModifier } from './createModifier';
import type { Color } from './types';

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
 * Sets the background tint color for a Live Activity.
 * @param color - The background tint color, or `null` to use the system default.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/activitybackgroundtint(_:)).
 */
export const activityBackgroundTint = (color: Color | null) =>
  createModifier('activityBackgroundTint', { color });
