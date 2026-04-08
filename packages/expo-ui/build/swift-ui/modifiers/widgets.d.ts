/**
 * Specifies the how to render an Image when using the WidgetKit/WidgetRenderingMode/accented mode.
 * @param renderingMode - A constant describing how the Image should be rendered.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/image/widgetaccentedrenderingmode(_:)).
 */
export declare const widgetAccentedRenderingMode: (renderingMode: "fullColor" | "accented" | "desaturated" | "accentedDesaturated") => import("./createModifier").ModifierConfig;
/**
 * Sets the URL to open in the containing app when the user clicks the widget.
 * Widgets support one widgetURL modifier in their view hierarchy. If multiple views have widgetURL modifiers, the behavior is undefined.
 * @param url - The URL to open in the containing app.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/widgetURL(_:)).
 */
export declare const widgetURL: (url: string) => import("./createModifier").ModifierConfig;
/**
 * Sets a container background color for a widget or live activity.
 * Use this to set the background style of a widget or the expanded area of a live activity.
 * Applies to the `.widget` container background placement.
 * @param color - The background color.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/containerbackground(_:for:)).
 */
export declare const containerBackground: (color: string) => import("./createModifier").ModifierConfig;
/**
 * Marks the content of a widget or live activity as invalidatable,
 * allowing the system to apply visual effects when the content is stale.
 * @param isInvalidatable - Whether the content should be marked as invalidatable.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/invalidatablecontent(_:)).
 */
export declare const invalidatableContent: (isInvalidatable?: boolean) => import("./createModifier").ModifierConfig;
/**
 * Disables the default content margins for a widget.
 * Allows widget content to extend to the edges of the widget.
 * @param disabled - Whether to disable content margins. Defaults to `true`.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/widgetkit/widgetconfiguration/contentmarginsdisabled(_:)).
 */
export declare const contentMarginsDisabled: (disabled?: boolean) => import("./createModifier").ModifierConfig;
/**
 * Prevents a view from being redacted when the widget is in a placeholder state.
 * Useful for content that should always be visible even during redaction (e.g., icons, static labels).
 * @platform ios 15.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/unredacted()).
 */
export declare const unredacted: () => import("./createModifier").ModifierConfig;
//# sourceMappingURL=widgets.d.ts.map