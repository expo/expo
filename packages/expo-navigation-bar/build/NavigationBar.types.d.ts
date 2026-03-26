/**
 * Visibility of the navigation bar.
 */
export type NavigationBarVisibility = 'visible' | 'hidden';
/**
 * Current system UI visibility state. Due to platform constraints, this will return when the status bar visibility changes as well as the navigation bar.
 */
export type NavigationBarVisibilityEvent = {
    /**
     * Current navigation bar visibility.
     */
    visibility: NavigationBarVisibility;
    /**
     * Native Android system UI visibility state, returned from the native Android `setOnSystemUiVisibilityChangeListener` API.
     */
    rawVisibility: number;
};
/**
 * Navigation bar style.
 *
 * - `auto` will automatically adjust based on the current theme.
 * - `light` a light navigation bar with dark content.
 * - `dark` a dark navigation bar with light content.
 * - `inverted` the bar colors are inverted in relation to the current theme.
 */
export type NavigationBarStyle = 'auto' | 'inverted' | 'light' | 'dark';
//# sourceMappingURL=NavigationBar.types.d.ts.map