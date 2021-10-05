import { EventEmitter, Platform, Subscription, UnavailabilityError } from 'expo-modules-core';
import { ColorValue, processColor } from 'react-native';

import ExpoSystemNavigationBar from './ExpoSystemNavigationBar';
import {
  NavigationBarForegroundStyle,
  NavigationBarVisibility,
  SystemUIBehavior,
} from './SystemNavigationBar.types';

const emitter = new EventEmitter(ExpoSystemNavigationBar);

type VisibilityEvent = {
  visibility: number;
  statusBar: boolean;
  navigationBar: boolean;
};

export function addVisibilityListener(listener: (event: VisibilityEvent) => void): Subscription {
  return emitter.addListener('Expo.visibilityDidChange', listener);
}

const assertIsOnPlatform = (functionName: string, onlyAvailableOn: typeof Platform['OS'][]) => {
  if (!onlyAvailableOn.includes(Platform.OS)) {
    throw new UnavailabilityError('ExpoSystemNavigationBar', functionName);
  }
};

/**
 * Changes the Android Navigation Bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setBackgroundColorAsync("white");
 * ```
 */
export function setBackgroundColorAsync(color: ColorValue): Promise<void> {
  assertIsOnPlatform('setBackgroundColorAsync', ['android']);
  const colorNumber = processColor(color);
  return ExpoSystemNavigationBar.setBackgroundColorAsync(colorNumber);
}
/**
 * Gets the Android Navigation Bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await SystemUI.getBackgroundColorAsync();
 * ```
 */
export function getBackgroundColorAsync(): Promise<ColorValue> {
  assertIsOnPlatform('getBackgroundColorAsync', ['android']);
  return ExpoSystemNavigationBar.getBackgroundColorAsync();
}

/**
 * Changes the Android Navigation Bar's Divider color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setBorderColorAsync("red");
 * ```
 */
export function setBorderColorAsync(color: ColorValue): Promise<void> {
  assertIsOnPlatform('setBorderColorAsync', ['android']);
  const colorNumber = processColor(color);
  return ExpoSystemNavigationBar.setBorderColorAsync(colorNumber);
}

/**
 * Gets the Android Navigation Bar's Divider color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await SystemUI.getBorderColorAsync();
 * ```
 */
export function getBorderColorAsync(): Promise<ColorValue> {
  assertIsOnPlatform('getBorderColorAsync', ['android']);
  return ExpoSystemNavigationBar.getBorderColorAsync();
}

/**
 * Changes the Android Navigation Bar's visibility.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setVisibilityAsync("hidden");
 * ```
 */
export function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void> {
  assertIsOnPlatform('setVisibilityAsync', ['android']);
  return ExpoSystemNavigationBar.setVisibilityAsync(visibility);
}

/**
 * Changes the Android Navigation Bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setAppearanceAsync("light");
 * ```
 */
export function setAppearanceAsync(style: NavigationBarForegroundStyle): Promise<void> {
  assertIsOnPlatform('setAppearanceAsync', ['android']);
  return ExpoSystemNavigationBar.setAppearanceAsync(style);
}
/**
 * Gets the Android Navigation Bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const style = await SystemUI.getAppearanceAsync();
 * ```
 */
export function getAppearanceAsync(): Promise<NavigationBarForegroundStyle> {
  assertIsOnPlatform('getAppearanceAsync', ['android']);
  return ExpoSystemNavigationBar.getAppearanceAsync();
}

/**
 * Sets whether the App should draw behind the Status Bar and Navigation Bar.
 *
 * When drawing behind the Status and Navigation Bar, make sure to adjust the Safe Area Insets accordingly.
 *
 * This is often used in conjunction with `setStatusBarBackgroundColor` and `setBackgroundColorAsync`
 * to enable an "edge-to-edge" mode by making the System UI transparent and letting your App draw beneath.
 *
 * @platform android
 *
 * @example
 * ```ts
 * // enables edge-to-edge mode
 * SystemUI.setPositionAsync('absolute')
 * // transparent backgrounds to see through
 * SystemUI.setStatusBarBackgroundColor('#ffffff00')
 * SystemUI.setBackgroundColorAsync('#ffffff00')
 * ```
 */
export function setPositionAsync(position: 'absolute' | 'relative'): Promise<void> {
  assertIsOnPlatform('setPositionAsync', ['android']);
  return ExpoSystemNavigationBar.setPositionAsync(position);
}

/**
 * Gets whether the App draws behind the Status Bar and Navigation Bar.
 *
 * @platform android
 */
export function getPositionAsync(): Promise<'absolute' | 'relative'> {
  assertIsOnPlatform('getPositionAsync', ['android']);
  return ExpoSystemNavigationBar.getPositionAsync();
}

/**
 * Sets the behavior of the Status Bar and Navigation Bar when they are hidden and the user wants to reveal them.
 *
 * For example, if the Navigation Bar is hidden (`setVisibilityAsync(false)`) and the System UI behavior
 * is `'overlay-swipe'`, the user can swipe from the bottom of the screen to temporarily reveal the Navigation Bar.
 *
 * * `'overlay-swipe'`: Temporarily reveals the System UI after a swipe gesture (bottom or top) without insetting your App's content.
 * * `'inset-swipe'`: Reveals the System UI after a swipe gesture (bottom or top) and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 * * `'inset-touch'`: Reveals the System UI after a touch anywhere on the screen and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 *
 * @platform android
 */
export function setBehaviorAsync(behavior: SystemUIBehavior): Promise<void> {
  assertIsOnPlatform('getBehaviorAsync', ['android']);
  return ExpoSystemNavigationBar.getBehaviorAsync(behavior);
}

/**
 * Gets the behavior of the Status Bar and Navigation Bar when the user swipes or touches the screen.
 *
 * @platform android
 */
export function getBehaviorAsync(): Promise<SystemUIBehavior> {
  assertIsOnPlatform('getBehaviorAsync', ['android']);
  return ExpoSystemNavigationBar.getBehaviorAsync();
}

export * from './SystemNavigationBar.types';
