import { type EventSubscription, Platform, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import { processColor } from 'react-native';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

import ExpoNavigationBar from './ExpoNavigationBar';
import {
  NavigationBarBehavior,
  NavigationBarButtonStyle,
  NavigationBarPosition,
  NavigationBarVisibility,
  NavigationBarVisibilityEvent,
} from './NavigationBar.types';

const shouldWarnAboutEdgeToEdge = Platform.OS === 'android' && isEdgeToEdge();
const defaultMessage =
  'Using expo-navigation-bar in apps with edge-to-edge layout enabled may cause unexpected behavior. Instead, use the SystemBars component from react-native-edge-to-edge. Learn more: https://expo.fyi/edge-to-edge-system-bars';

function potentiallyWarnAboutEdgeToEdge(message: string = defaultMessage) {
  if (shouldWarnAboutEdgeToEdge) {
    console.warn(message);
  }
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
export function addVisibilityListener(
  listener: (event: NavigationBarVisibilityEvent) => void
): EventSubscription {
  // Assert so the type is non-nullable.
  if (!ExpoNavigationBar.addListener) {
    throw new UnavailabilityError('NavigationBar', 'addVisibilityListener');
  }
  return ExpoNavigationBar.addListener('ExpoNavigationBar.didChange', listener);
}

/**
 * Changes the navigation bar's background color.
 *
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * NavigationBar.setBackgroundColorAsync("white");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBackgroundColorAsync(color: string): Promise<void> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Setting the background color of the navigation bar is not supported when edge-to-edge is enabled And may lead to unexpected behavoir. Use the `setStyle` method instead.'
    );
  }
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
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * const color = await NavigationBar.getBackgroundColorAsync();
 * ```
 * @returns Current navigation bar color in hex format. Returns `#00000000` (transparent) on unsupported platforms (iOS, web).
 *
 */
export async function getBackgroundColorAsync(): Promise<string> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Getting the background color of the navigation bar is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
  if (Platform.OS !== 'android') {
    console.warn('`getBackgroundColorAsync` is only available on Android');
    return `#00000000`;
  }
  return await ExpoNavigationBar.getBackgroundColorAsync();
}

/**
 * Changes the navigation bar's border color.
 *
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * NavigationBar.setBorderColorAsync("red");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBorderColorAsync(color: string): Promise<void> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Setting the border color of the navigation bar is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
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
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * const color = await NavigationBar.getBorderColorAsync();
 * ```
 * @returns Navigation bar top border color in hex format. Returns `#00000000` (transparent) on unsupported platforms (iOS, web).
 */
export async function getBorderColorAsync(): Promise<string> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Getting the border color of the navigation bar is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
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
 * @param visibility Based on CSS visibility property.
 */
export async function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void> {
  // We should never enter this if statement
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Legacy `setVisibilityAsync function has been called with edge-to-edge enabled. Make sure that `react-native-edge-to-edge` is properly configured in your project.'
    );
  }
  if (Platform.OS !== 'android') {
    console.warn('`setVisibilityAsync` is only available on Android');
    return;
  }
  await ExpoNavigationBar.setVisibilityAsync(visibility);
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
export async function getVisibilityAsync(): Promise<NavigationBarVisibility> {
  if (Platform.OS !== 'android') {
    console.warn('`getVisibilityAsync` is only available on Android');
    return 'hidden';
  }
  return ExpoNavigationBar.getVisibilityAsync();
}

/**
 * Changes the navigation bar's button colors between white (`light`) and a dark gray color (`dark`).
 *
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * NavigationBar.setButtonStyleAsync("light");
 * ```
 * @param style Dictates the color of the foreground element color.
 */
export async function setButtonStyleAsync(style: NavigationBarButtonStyle): Promise<void> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Setting the navigation bar button style is not supported when edge-to-edge is enabled and may lead to unexpected behavior. Use the `setStyle` method instead.'
    );
  }
  if (Platform.OS !== 'android') {
    console.warn('`setButtonStyleAsync` is only available on Android');
    return;
  }
  await ExpoNavigationBar.setButtonStyleAsync(style);
}

/**
 * Gets the navigation bar's button color styles.
 *
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * const style = await NavigationBar.getButtonStyleAsync();
 * ```
 * @returns Navigation bar foreground element color settings. Returns `light` on unsupported platforms (iOS, web).
 */
export async function getButtonStyleAsync(): Promise<NavigationBarButtonStyle> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Getting the navigation bar button style is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
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
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
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
export async function setPositionAsync(position: NavigationBarPosition): Promise<void> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Setting the navigation bar position is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
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
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * await NavigationBar.unstable_getPositionAsync()
 * ```
 * @returns Navigation bar positional rendering mode. Returns `relative` on unsupported platforms (iOS, web).
 */
export async function unstable_getPositionAsync(): Promise<NavigationBarPosition> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Using the `unstable_getPositionAsync` function is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
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
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * await NavigationBar.setBehaviorAsync('overlay-swipe')
 * ```
 * @param behavior Dictates the interaction behavior of the navigation bar.
 */
export async function setBehaviorAsync(behavior: NavigationBarBehavior): Promise<void> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Setting the behavior of the navigation bar is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
  if (Platform.OS !== 'android') {
    console.warn('`setBehaviorAsync` is only available on Android');
    return;
  }
  return await ExpoNavigationBar.setBehaviorAsync(behavior);
}

/**
 * Gets the behavior of the status and navigation bars when the user swipes or touches the screen.
 *
 * > This method is supported only when edge-to-edge is disabled. Using it in edge-to-edge app may lead to unexpected behavior.
 *
 * @example
 * ```ts
 * await NavigationBar.getBehaviorAsync()
 * ```
 * @returns Navigation bar interaction behavior. Returns `inset-touch` on unsupported platforms (iOS, web).
 */
export async function getBehaviorAsync(): Promise<NavigationBarBehavior> {
  if (__DEV__) {
    potentiallyWarnAboutEdgeToEdge(
      'Getting the behavior of the navigation bar is not supported when edge-to-edge is enabled and may lead to unexpected behavior.'
    );
  }
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
export function useVisibility(): NavigationBarVisibility | null {
  const [visibility, setVisible] = useState<NavigationBarVisibility | null>(null);

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
