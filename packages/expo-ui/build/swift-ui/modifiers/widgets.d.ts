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
//# sourceMappingURL=widgets.d.ts.map