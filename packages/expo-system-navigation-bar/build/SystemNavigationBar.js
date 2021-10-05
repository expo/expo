import React, { useState } from 'react';
import { EventEmitter, Platform, UnavailabilityError } from 'expo-modules-core';
import { processColor } from 'react-native';
import ExpoSystemNavigationBar from './ExpoSystemNavigationBar';
const emitter = new EventEmitter(ExpoSystemNavigationBar);
export function addVisibilityListener(listener) {
    return emitter.addListener('ExpoSystemNavigationBar.didChange', listener);
}
const assertIsOnPlatform = (functionName, onlyAvailableOn) => {
    if (!onlyAvailableOn.includes(Platform.OS)) {
        throw new UnavailabilityError('ExpoSystemNavigationBar', functionName);
    }
};
/**
 * Changes the navigation bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * NavigationBar.setBackgroundColorAsync("white");
 * ```
 */
export function setBackgroundColorAsync(color) {
    assertIsOnPlatform('setBackgroundColorAsync', ['android']);
    const colorNumber = processColor(color);
    return ExpoSystemNavigationBar.setBackgroundColorAsync(colorNumber);
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
export function getBackgroundColorAsync() {
    assertIsOnPlatform('getBackgroundColorAsync', ['android']);
    return ExpoSystemNavigationBar.getBackgroundColorAsync();
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
export function setBorderColorAsync(color) {
    assertIsOnPlatform('setBorderColorAsync', ['android']);
    const colorNumber = processColor(color);
    return ExpoSystemNavigationBar.setBorderColorAsync(colorNumber);
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
    return ExpoSystemNavigationBar.getBorderColorAsync();
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
export function setVisibilityAsync(visibility) {
    assertIsOnPlatform('setVisibilityAsync', ['android']);
    return ExpoSystemNavigationBar.setVisibilityAsync(visibility);
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
export function getVisibilityAsync() {
    assertIsOnPlatform('getVisibilityAsync', ['android']);
    return ExpoSystemNavigationBar.getVisibilityAsync();
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
export function setAppearanceAsync(style) {
    assertIsOnPlatform('setAppearanceAsync', ['android']);
    return ExpoSystemNavigationBar.setAppearanceAsync(style);
}
/**
 * Gets the navigation bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const style = await NavigationBar.getAppearanceAsync();
 * ```
 */
export function getAppearanceAsync() {
    assertIsOnPlatform('getAppearanceAsync', ['android']);
    return ExpoSystemNavigationBar.getAppearanceAsync();
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
 * NavigationBar.setPositionAsync('absolute')
 * // transparent backgrounds to see through
 * NavigationBar.setBackgroundColorAsync('#ffffff00')
 * ```
 */
export function setPositionAsync(position) {
    assertIsOnPlatform('setPositionAsync', ['android']);
    return ExpoSystemNavigationBar.setPositionAsync(position);
}
/**
 * Whether the navigation and status bars float above the app (absolute) or sit inline with it (relative).
 *
 * @platform android
 */
export function getPositionAsync() {
    assertIsOnPlatform('getPositionAsync', ['android']);
    return ExpoSystemNavigationBar.getPositionAsync();
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
export function setBehaviorAsync(behavior) {
    assertIsOnPlatform('getBehaviorAsync', ['android']);
    return ExpoSystemNavigationBar.setBehaviorAsync(behavior);
}
/**
 * Gets the behavior of the status and navigation bars when the user swipes or touches the screen.
 *
 * @platform android
 */
export function getBehaviorAsync() {
    assertIsOnPlatform('getBehaviorAsync', ['android']);
    return ExpoSystemNavigationBar.getBehaviorAsync();
}
export * from './SystemNavigationBar.types';
export function useVisibility() {
    const [visibility, setVisible] = useState(null);
    React.useEffect(() => {
        let isMounted = true;
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
//# sourceMappingURL=SystemNavigationBar.js.map