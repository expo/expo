export type PageIndexDisplayMode = 'automatic' | 'always' | 'never';
/**
 * Configuration for the `tabViewStyle` modifier.
 *
 *  - `'page'` — swipeable horizontal pager with optional dot indicators.
 *  - `'automatic'` — SwiftUI's default tab-bar style.
 *  - `'sidebarAdaptable'` — iOS 18+. Sidebar on iPad/Mac, bottom bar on
 *    iPhone.
 */
export type TabViewStyleConfig = {
    type: 'page';
    /**
     * Visibility of the page indicator dots. Only meaningful for the page style.
     * @default 'automatic'
     */
    indexDisplayMode?: PageIndexDisplayMode;
} | {
    type: 'automatic';
} | {
    type: 'sidebarAdaptable';
};
/**
 * Sets the style for a `TabView`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/tabviewstyle(_:)).
 */
export declare const tabViewStyle: (config: TabViewStyleConfig) => import("./createModifier").ModifierConfig;
export type PageIndexBackgroundDisplayMode = 'automatic' | 'always' | 'never' | 'interactive';
/**
 * Configuration for the `indexViewStyle` modifier.
 */
export type IndexViewStyleConfig = {
    /**
     * Translucent background behind the page indicator dots. Useful when the
     * dots sit on top of dark or busy content.
     * @default 'automatic'
     */
    backgroundDisplayMode?: PageIndexBackgroundDisplayMode;
};
/**
 * Sets the style for the page index view inside a `TabView`. SwiftUI only
 * ships a `.page` index view style, so no style selector is exposed.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/indexviewstyle(_:)).
 */
export declare const indexViewStyle: (config?: IndexViewStyleConfig) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=tabViewModifiers.d.ts.map