import { UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';
/**
 * A component that allows you to configure your navigation bar declaratively.
 *
 * You will likely have multiple `NavigationBar` components mounted in the same app at the same time.
 * For example, if you have multiple screens in your app, you may end up using one per screen.
 * The props of each `NavigationBar` component will be merged in the order that they were mounted.
 */
export function NavigationBar(props) {
    return null;
}
/**
 * Sets the style of the navigation bar.
 *
 * > This will have an effect when the following conditions are met:
 * > - The device navigation bar is using buttons.
 * > - The `enforceContrast` option of the `expo-navigation-bar` plugin is set to `false`.
 *
 * > Due to a bug in the Android 15 emulator this function may have no effect. Try a physical device or an emulator with a different version of Android.
 *
 * @param style The color of the navigation bar buttons.
 * @platform android
 *
 * @example
 * ```ts
 * NavigationBar.setStyle("dark");
 * ```
 */
NavigationBar.setStyle = (style) => console.warn('`setStyle` method is only available on Android');
/**
 * @deprecated Use `NavigationBar.setStyle` instead. This will be removed in a future release.
 */
export const setStyle = NavigationBar.setStyle;
/**
 * Set the navigation bar's visibility.
 *
 * @param hidden If the navigation bar should be hidden.
 * @platform android
 *
 * @example
 * ```ts
 * NavigationBar.setHidden(true);
 * ```
 */
NavigationBar.setHidden = (hidden) => console.warn('`setHidden` method is only available on Android');
/**
 * Observe changes to the system navigation bar.
 * Due to platform constraints, this callback will also be triggered when the status bar visibility changes.
 *
 * @deprecated This will be removed in a future release.
 */
export function addVisibilityListener(listener) {
    throw new UnavailabilityError('NavigationBar', 'addVisibilityListener');
}
/**
 * Set the navigation bar's visibility.
 *
 * @param visibility Based on CSS visibility property.
 * @platform android
 * @deprecated Use `NavigationBar.setHidden` instead. This will be removed in a future release.
 */
export async function setVisibilityAsync(visibility) {
    console.warn('`setVisibilityAsync` is only available on Android');
}
/**
 * Get the navigation bar's visibility.
 *
 * @returns Navigation bar's current visibility status. Returns `hidden` on unsupported platforms (iOS, web).
 * @deprecated This will be removed in a future release.
 */
export async function getVisibilityAsync() {
    console.warn('`getVisibilityAsync` is only available on Android');
    return 'hidden';
}
/**
 * React hook that statefully updates with the visibility of the system navigation bar.
 *
 * @returns Visibility of the navigation bar, `null` during async initialization.
 * @deprecated This will be removed in a future release.
 */
export function useVisibility() {
    const [visibility, setVisible] = useState(null);
    useEffect(() => {
        setVisible('hidden');
    }, []);
    return visibility;
}
//# sourceMappingURL=NavigationBar.js.map