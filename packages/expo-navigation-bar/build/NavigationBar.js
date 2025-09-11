import { UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';
/**
 * Observe changes to the system navigation bar.
 * Due to platform constraints, this callback will also be triggered when the status bar visibility changes.
 *
 * @example
 * ```ts
 * NavigationBar.addVisibilityListener(({ visibility }) => {
 *   // ...
 * });
 * ```
 */
export function addVisibilityListener(listener) {
    throw new UnavailabilityError('NavigationBar', 'addVisibilityListener');
}
/**
 * Changes the navigation bar's background color.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * NavigationBar.setBackgroundColorAsync("white");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBackgroundColorAsync(color) {
    console.warn('`setBackgroundColorAsync` is only available on Android');
}
/**
 * Gets the navigation bar's background color.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * const color = await NavigationBar.getBackgroundColorAsync();
 * ```
 * @returns Current navigation bar color in hex format. Returns `#00000000` (transparent) on unsupported platforms (iOS, web).
 *
 */
export async function getBackgroundColorAsync() {
    console.warn('`getBackgroundColorAsync` is only available on Android');
    return `#00000000`;
}
/**
 * Changes the navigation bar's border color.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * NavigationBar.setBorderColorAsync("red");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBorderColorAsync(color) {
    console.warn('`setBorderColorAsync` is only available on Android');
}
/**
 * Gets the navigation bar's top border color, also known as the "divider color".
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * const color = await NavigationBar.getBorderColorAsync();
 * ```
 * @returns Navigation bar top border color in hex format. Returns `#00000000` (transparent) on unsupported platforms (iOS, web).
 */
export async function getBorderColorAsync() {
    console.warn('`getBorderColorAsync` is only available on Android');
    return `#00000000`;
}
/**
 * Set the navigation bar's visibility.
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 * @param visibility Based on CSS visibility property.
 * @platform android
 */
export async function setVisibilityAsync(visibility) {
    console.warn('`setVisibilityAsync` is only available on Android');
}
/**
 * Get the navigation bar's visibility.
 *
 *
 * @example
 * ```ts
 * const visibility = await NavigationBar.getVisibilityAsync("hidden");
 * ```
 * @returns Navigation bar's current visibility status. Returns `hidden` on unsupported platforms (iOS, web).
 */
export async function getVisibilityAsync() {
    console.warn('`getVisibilityAsync` is only available on Android');
    return 'hidden';
}
/**
 * Changes the navigation bar's button colors between white (`light`) and a dark gray color (`dark`).
 *
 * @example
 * ```ts
 * NavigationBar.setButtonStyleAsync("light");
 * ```
 * @param style Dictates the color of the foreground element color.
 */
export async function setButtonStyleAsync(style) {
    console.warn('`setButtonStyleAsync` is only available on Android');
}
/**
 * Gets the navigation bar's button color styles.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * const style = await NavigationBar.getButtonStyleAsync();
 * ```
 * @returns Navigation bar foreground element color settings. Returns `light` on unsupported platforms (iOS, web).
 */
export async function getButtonStyleAsync() {
    console.warn('`getButtonStyleAsync` is only available on Android');
    return 'light';
}
/**
 * Sets positioning method used for the navigation bar (and status bar).
 * Setting position `absolute` will float the navigation bar above the content,
 * whereas position `relative` will shrink the screen to inline the navigation bar.
 *
 * When drawing behind the status and navigation bars, ensure the safe area insets are adjusted accordingly.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * // enables edge-to-edge mode
 * await NavigationBar.setPositionAsync('absolute')
 * // transparent backgrounds to see through
 * await NavigationBar.setBackgroundColorAsync('#ffffff00')
 * ```
 * @param position Based on CSS position property.
 */
export async function setPositionAsync(position) {
    console.warn('`setPositionAsync` is only available on Android');
}
/**
 * Whether the navigation and status bars float above the app (absolute) or sit inline with it (relative).
 * This value can be incorrect if `androidNavigationBar.visible` is used instead of the config plugin `position` property.
 *
 * This method is unstable because the position can be set via another native module and get out of sync.
 * Alternatively, you can get the position by measuring the insets returned by `react-native-safe-area-context`.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * await NavigationBar.unstable_getPositionAsync()
 * ```
 * @returns Navigation bar positional rendering mode. Returns `relative` on unsupported platforms (iOS, web).
 */
export async function unstable_getPositionAsync() {
    console.warn('`unstable_getPositionAsync` is only available on Android');
    return 'relative';
}
/**
 * Sets the behavior of the status bar and navigation bar when they are hidden and the user wants to reveal them.
 *
 * For example, if the navigation bar is hidden (`setVisibilityAsync(false)`) and the behavior
 * is `'overlay-swipe'`, the user can swipe from the bottom of the screen to temporarily reveal the navigation bar.
 *
 * - `'overlay-swipe'`: Temporarily reveals the System UI after a swipe gesture (bottom or top) without insetting your App's content.
 * - `'inset-swipe'`: Reveals the System UI after a swipe gesture (bottom or top) and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 * - `'inset-touch'`: Reveals the System UI after a touch anywhere on the screen and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * await NavigationBar.setBehaviorAsync('overlay-swipe')
 * ```
 * @param behavior Dictates the interaction behavior of the navigation bar.
 */
export async function setBehaviorAsync(behavior) {
    console.warn('`setBehaviorAsync` is only available on Android');
}
/**
 * Gets the behavior of the status and navigation bars when the user swipes or touches the screen.
 *
 * > This method is supported only when edge-to-edge is disabled.
 *
 * @example
 * ```ts
 * await NavigationBar.getBehaviorAsync()
 * ```
 * @returns Navigation bar interaction behavior. Returns `inset-touch` on unsupported platforms (iOS, web).
 */
export async function getBehaviorAsync() {
    console.warn('`getBehaviorAsync` is only available on Android');
    return 'inset-touch';
}
/**
 * Sets the style of the navigation bar.
 * > This will have an effect when the following conditions are met:
 * > - Edge-to-edge is enabled
 * > - The `enforceNavigationBarContrast` option of the `react-native-edge-to-edge` plugin is set to `false`.
 * > - The device is using the three-button navigation bar.
 *
 * > Due to a bug in the Android 15 emulator this function may have no effect. Try a physical device or an emulator with a different version of Android.
 *
 * @platform android
 */
export function setStyle(style) {
    console.warn('`setStyle` method is only available on Android');
}
/**
 * React hook that statefully updates with the visibility of the system navigation bar.
 *
 * @example
 * ```ts
 * function App() {
 *   const visibility = NavigationBar.useVisibility()
 *   // React Component...
 * }
 * ```
 * @returns Visibility of the navigation bar, `null` during async initialization.
 */
export function useVisibility() {
    const [visibility, setVisible] = useState(null);
    useEffect(() => {
        setVisible('hidden');
    }, []);
    return visibility;
}
//# sourceMappingURL=NavigationBar.js.map