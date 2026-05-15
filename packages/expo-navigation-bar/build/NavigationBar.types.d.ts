/**
 * Visibility of the navigation bar.
 * @deprecated This will be removed in a future release.
 */
export type NavigationBarVisibility = 'visible' | 'hidden';
/**
 * Current system UI visibility state. Due to platform constraints, this will return when the status bar visibility changes as well as the navigation bar.
 * @deprecated This will be removed in a future release.
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
export type NavigationBarProps = {
    /**
     * Sets the color of the navigation bar buttons. Default value is `"auto"`
     * which picks the appropriate value according to the active color scheme,
     * eg: if your app is dark mode, the style will be `"light"`.
     *
     * > This will have an effect when the following conditions are met:
     * > - The device navigation bar is using buttons.
     * > - The `enforceContrast` option of the `expo-navigation-bar` plugin is set to `false`.
     *
     * > Due to a bug in the Android 15 emulator this function may have no effect. Try a physical device or an emulator with a different version of Android.
     *
     * @default 'auto'
     */
    style?: NavigationBarStyle;
    /**
     * If the navigation bar is hidden.
     */
    hidden?: boolean;
};
//# sourceMappingURL=NavigationBar.types.d.ts.map