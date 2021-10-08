import { EventEmitter, Platform, UnavailabilityError } from 'expo-modules-core';
import React, { useState } from 'react';
import { processColor } from 'react-native';
import ExpoNavigationBar from './ExpoNavigationBar';
const emitter = new EventEmitter(ExpoNavigationBar);
/**
 * Observe changes to the system navigation bar.
 * Due to platform constraints, this callback will also be triggered when the status bar visibility changes.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * NavigationBar.addVisibilityListener(({ visibility }) => {
 *   // ...
 * });
 * ```
 */
export function addVisibilityListener(listener) {
    return emitter.addListener('ExpoNavigationBar.didChange', listener);
}
const assertIsOnPlatform = (functionName, onlyAvailableOn) => {
    if (!onlyAvailableOn.includes(Platform.OS)) {
        throw new UnavailabilityError('ExpoNavigationBar', functionName);
    }
};
/**
 * Changes the navigation bar's background color.
 *
 * @platform android
 *
 * @param color any valid CSS color
 *
 * @example
 * ```typescript
 * NavigationBar.setBackgroundColorAsync("white");
 * ```
 */
export async function setBackgroundColorAsync(color) {
    assertIsOnPlatform('setBackgroundColorAsync', ['android']);
    const colorNumber = processColor(color);
    return await ExpoNavigationBar.setBackgroundColorAsync(colorNumber);
}
/**
 * Gets the navigation bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await NavigationBar.getBackgroundColorAsync();
 * ```
 */
export async function getBackgroundColorAsync() {
    assertIsOnPlatform('getBackgroundColorAsync', ['android']);
    return await ExpoNavigationBar.getBackgroundColorAsync();
}
/**
 * Changes the navigation bar's border color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * NavigationBar.setBorderColorAsync("red");
 * ```
 */
export async function setBorderColorAsync(color) {
    if (ExpoNavigationBar.setBorderColorAsync) {
        const colorNumber = processColor(color);
        await ExpoNavigationBar.setBorderColorAsync(colorNumber);
    }
}
/**
 * Gets the navigation bar's border color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await NavigationBar.getBorderColorAsync();
 * ```
 */
export function getBorderColorAsync() {
    assertIsOnPlatform('getBorderColorAsync', ['android']);
    return ExpoNavigationBar.getBorderColorAsync();
}
/**
 * Set the navigation bar's visibility.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 */
export async function setVisibilityAsync(visibility) {
    if (ExpoNavigationBar.setVisibilityAsync) {
        await ExpoNavigationBar.setVisibilityAsync(visibility);
    }
}
/**
 * Get the navigation bar's visibility.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 */
export async function getVisibilityAsync() {
    assertIsOnPlatform('getVisibilityAsync', ['android']);
    return ExpoNavigationBar.getVisibilityAsync();
}
/**
 * Changes the navigation bar's foreground style between white and a dark gray color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * NavigationBar.setAppearanceAsync("light");
 * ```
 */
export async function setAppearanceAsync(style) {
    if (ExpoNavigationBar.setAppearanceAsync) {
        await ExpoNavigationBar.setAppearanceAsync(style);
    }
}
/**
 * Gets the navigation bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const appearance = await NavigationBar.getAppearanceAsync();
 * ```
 */
export async function getAppearanceAsync() {
    assertIsOnPlatform('getAppearanceAsync', ['android']);
    return await ExpoNavigationBar.getAppearanceAsync();
}
/**
 * Sets positioning method used for the navigation bar (and status bar).
 * Setting position `absolute` will float the navigation bar above the content,
 * whereas position `relative` will shrink the screen to inline the navigation bar.
 *
 * When drawing behind the status and navigation bars, ensure the safe area insets are adjusted accordingly.
 *
 * @platform android
 *
 * @example
 * ```ts
 * // enables edge-to-edge mode
 * await NavigationBar.setPositionAsync('absolute')
 * // transparent backgrounds to see through
 * await NavigationBar.setBackgroundColorAsync('#ffffff00')
 * ```
 */
export async function setPositionAsync(position) {
    if (ExpoNavigationBar.setPositionAsync) {
        await ExpoNavigationBar.setPositionAsync(position);
    }
}
/**
 * Whether the navigation and status bars float above the app (absolute) or sit inline with it (relative).
 * This value can be incorrect if `androidNavigationBar.visible` is used instead of the config plugin `position` property.
 *
 * @platform android
 */
export async function getPositionAsync() {
    assertIsOnPlatform('getPositionAsync', ['android']);
    return await ExpoNavigationBar.getPositionAsync();
}
/**
 * Sets the behavior of the status bar and navigation bar when they are hidden and the user wants to reveal them.
 *
 * For example, if the navigation bar is hidden (`setVisibilityAsync(false)`) and the behavior
 * is `'overlay-swipe'`, the user can swipe from the bottom of the screen to temporarily reveal the navigation bar.
 *
 * * `'overlay-swipe'`: Temporarily reveals the System UI after a swipe gesture (bottom or top) without insetting your App's content.
 * * `'inset-swipe'`: Reveals the System UI after a swipe gesture (bottom or top) and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 * * `'inset-touch'`: Reveals the System UI after a touch anywhere on the screen and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 *
 * @platform android
 */
export async function setBehaviorAsync(behavior) {
    assertIsOnPlatform('setBehaviorAsync', ['android']);
    return await ExpoNavigationBar.setBehaviorAsync(behavior);
}
/**
 * Gets the behavior of the status and navigation bars when the user swipes or touches the screen.
 *
 * @platform android
 */
export async function getBehaviorAsync() {
    assertIsOnPlatform('getBehaviorAsync', ['android']);
    return await ExpoNavigationBar.getBehaviorAsync();
}
/**
 * React hook that statefully updates with the visibility of the system navigation bar.
 *
 * @returns visibility of the navigation bar, `null` during async initialization.
 */
export function useVisibility() {
    const [visibility, setVisible] = useState(null);
    React.useEffect(() => {
        let isMounted = true;
        if (Platform.OS === 'android') {
            getVisibilityAsync().then((visibility) => {
                if (isMounted) {
                    setVisible(visibility);
                }
            });
        }
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