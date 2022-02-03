import { EventEmitter, Platform, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import { processColor } from 'react-native';
import ExpoNavigationBar from './ExpoNavigationBar';
let _emitter;
// Lazily initialize the event emitter because it isn't available on iOS,
// this enables us to use the same code for all platforms.
function getEmitter() {
    if (!_emitter) {
        _emitter = new EventEmitter(ExpoNavigationBar);
    }
    return _emitter;
}
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
    // Assert so the type is non-nullable.
    if (!ExpoNavigationBar.addListener) {
        throw new UnavailabilityError('NavigationBar', 'addVisibilityListener');
    }
    return getEmitter().addListener('ExpoNavigationBar.didChange', listener);
}
/**
 * Changes the navigation bar's background color.
 *
 * @example
 * ```ts
 * NavigationBar.setBackgroundColorAsync("white");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBackgroundColorAsync(color) {
    if (Platform.OS !== 'android') {
        console.warn('`setBackgroundColorAsync` is only available on Android');
        return;
    }
    const colorNumber = processColor(color);
    return await ExpoNavigationBar.setBackgroundColorAsync(colorNumber);
}
/**
 * Gets the navigation bar's background color.
 *
 * @example
 * ```ts
 * const color = await NavigationBar.getBackgroundColorAsync();
 * ```
 * @returns Current navigation bar color in hex format. Returns `#00000000` (transparent) on unsupported platforms (iOS, web).
 */
export async function getBackgroundColorAsync() {
    if (Platform.OS !== 'android') {
        console.warn('`getBackgroundColorAsync` is only available on Android');
        return `#00000000`;
    }
    return await ExpoNavigationBar.getBackgroundColorAsync();
}
/**
 * Changes the navigation bar's border color.
 *
 * @example
 * ```ts
 * NavigationBar.setBorderColorAsync("red");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBorderColorAsync(color) {
    if (Platform.OS !== 'android') {
        console.warn('`setBorderColorAsync` is only available on Android');
        return;
    }
    const colorNumber = processColor(color);
    await ExpoNavigationBar.setBorderColorAsync(colorNumber);
}
/**
 * Gets the navigation bar's top border color, also known as the "divider color".
 *
 * @example
 * ```ts
 * const color = await NavigationBar.getBorderColorAsync();
 * ```
 * @returns Navigation bar top border color in hex format. Returns `#00000000` (transparent) on unsupported platforms (iOS, web).
 */
export async function getBorderColorAsync() {
    if (Platform.OS !== 'android') {
        console.warn('`getBorderColorAsync` is only available on Android');
        return `#00000000`;
    }
    return await ExpoNavigationBar.getBorderColorAsync();
}
/**
 * Set the navigation bar's visibility.
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 * @param color Based on CSS visibility property.
 */
export async function setVisibilityAsync(visibility) {
    if (Platform.OS !== 'android') {
        console.warn('`setVisibilityAsync` is only available on Android');
        return;
    }
    await ExpoNavigationBar.setVisibilityAsync(visibility);
}
/**
 * Get the navigation bar's visibility.
 *
 * @example
 * ```ts
 * const visibility = await NavigationBar.getVisibilityAsync("hidden");
 * ```
 * @returns Navigation bar's current visibility status. Returns `hidden` on unsupported platforms (iOS, web).
 */
export async function getVisibilityAsync() {
    if (Platform.OS !== 'android') {
        console.warn('`getVisibilityAsync` is only available on Android');
        return 'hidden';
    }
    return ExpoNavigationBar.getVisibilityAsync();
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
    if (Platform.OS !== 'android') {
        console.warn('`setButtonStyleAsync` is only available on Android');
        return;
    }
    await ExpoNavigationBar.setButtonStyleAsync(style);
}
/**
 * Gets the navigation bar's button color styles.
 *
 * @example
 * ```ts
 * const style = await NavigationBar.getButtonStyleAsync();
 * ```
 * @returns Navigation bar foreground element color settings. Returns `light` on unsupported platforms (iOS, web).
 */
export async function getButtonStyleAsync() {
    if (Platform.OS !== 'android') {
        console.warn('`getButtonStyleAsync` is only available on Android');
        return 'light';
    }
    return await ExpoNavigationBar.getButtonStyleAsync();
}
/**
 * Sets positioning method used for the navigation bar (and status bar).
 * Setting position `absolute` will float the navigation bar above the content,
 * whereas position `relative` will shrink the screen to inline the navigation bar.
 *
 * When drawing behind the status and navigation bars, ensure the safe area insets are adjusted accordingly.
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
    if (Platform.OS !== 'android') {
        console.warn('`setPositionAsync` is only available on Android');
        return;
    }
    await ExpoNavigationBar.setPositionAsync(position);
}
/**
 * Whether the navigation and status bars float above the app (absolute) or sit inline with it (relative).
 * This value can be incorrect if `androidNavigationBar.visible` is used instead of the config plugin `position` property.
 *
 * This method is unstable because the position can be set via another native module and get out of sync.
 * Alternatively, you can get the position by measuring the insets returned by `react-native-safe-area-context`.
 *
 * @example
 * ```ts
 * await NavigationBar.unstable_getPositionAsync()
 * ```
 * @returns Navigation bar positional rendering mode. Returns `relative` on unsupported platforms (iOS, web).
 */
export async function unstable_getPositionAsync() {
    if (Platform.OS !== 'android') {
        console.warn('`unstable_getPositionAsync` is only available on Android');
        return 'relative';
    }
    return await ExpoNavigationBar.unstable_getPositionAsync();
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
 * @example
 * ```ts
 * await NavigationBar.setBehaviorAsync('overlay-swipe')
 * ```
 * @param behavior Dictates the interaction behavior of the navigation bar.
 */
export async function setBehaviorAsync(behavior) {
    if (Platform.OS !== 'android') {
        console.warn('`setBehaviorAsync` is only available on Android');
        return;
    }
    return await ExpoNavigationBar.setBehaviorAsync(behavior);
}
/**
 * Gets the behavior of the status and navigation bars when the user swipes or touches the screen.
 *
 * @example
 * ```ts
 * await NavigationBar.getBehaviorAsync()
 * ```
 * @returns Navigation bar interaction behavior. Returns `inset-touch` on unsupported platforms (iOS, web).
 */
export async function getBehaviorAsync() {
    if (Platform.OS !== 'android') {
        console.warn('`getBehaviorAsync` is only available on Android');
        return 'inset-touch';
    }
    return await ExpoNavigationBar.getBehaviorAsync();
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
        let isMounted = true;
        if (Platform.OS !== 'android') {
            setVisible('hidden');
            return;
        }
        getVisibilityAsync().then((visibility) => {
            if (isMounted) {
                setVisible(visibility);
            }
        });
        const listener = addVisibilityListener(({ visibility }) => {
            if (isMounted) {
                setVisible(visibility);
            }
        });
        return () => {
            listener.remove();
            isMounted = false;
        };
    }, []);
    return visibility;
}
export * from './NavigationBar.types';
//# sourceMappingURL=NavigationBar.js.map