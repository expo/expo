import { Platform, UnavailabilityError } from 'expo-modules-core';
import { ColorValue, processColor } from 'react-native';

import ExpoSystemUI from './ExpoSystemUI';

const assertIsOnPlatform = (functionName: string, onlyAvailableOn: typeof Platform['OS'][]) => {
  if (!onlyAvailableOn.includes(Platform.OS)) {
    throw new UnavailabilityError('ExpoSystemUI', functionName);
  }
};

export type SystemUIBehavior = 'overlay-swipe' | 'inset-swipe' | 'inset-touch';

export type NavigationBarForegroundStyle = 'light' | 'dark';
export type NavigationBarVisibility = 'visible' | 'hidden';
export type StatusBarForegroundStyle = 'light' | 'dark';
export type StatusBarVisibility = 'visible' | 'hidden';

/**
 * * "light": Light Mode
 * * "dark": Dark/Night Mode
 * * "auto": Follow System mode, automatically switch to dark mode.
 * * "unspecified": Default
 */
// export type Appearance = 'light' | 'dark' | 'auto' | 'default';

/**
 * Changes the Android Navigation Bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setNavigationBarBackgroundColor("white");
 * ```
 */
export function setNavigationBarBackgroundColor(color: ColorValue): Promise<void> {
  assertIsOnPlatform('setNavigationBarBackgroundColor', ['android']);
  const colorNumber = processColor(color);
  return ExpoSystemUI.setNavigationBarBackgroundColor(colorNumber);
}
/**
 * Gets the Android Navigation Bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await SystemUI.getNavigationBarBackgroundColor();
 * ```
 */
export function getNavigationBarBackgroundColor(): Promise<ColorValue> {
  assertIsOnPlatform('getNavigationBarBackgroundColor', ['android']);
  return ExpoSystemUI.getNavigationBarBackgroundColor();
}

/**
 * Changes the Android Navigation Bar's Divider color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setNavigationBarDividerColor("red");
 * ```
 */
export function setNavigationBarDividerColor(color: ColorValue): Promise<void> {
  assertIsOnPlatform('setNavigationBarDividerColor', ['android']);
  const colorNumber = processColor(color);
  return ExpoSystemUI.setNavigationBarDividerColor(colorNumber);
}

/**
 * Gets the Android Navigation Bar's Divider color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await SystemUI.getNavigationBarDividerColor();
 * ```
 */
export function getNavigationBarDividerColor(): Promise<ColorValue> {
  assertIsOnPlatform('getNavigationBarDividerColor', ['android']);
  return ExpoSystemUI.getNavigationBarDividerColor();
}

/**
 * Changes the Android Navigation Bar's visibility.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setNavigationBarVisibility("hidden");
 * ```
 */
export function setNavigationBarVisibility(visibility: NavigationBarVisibility): Promise<void> {
  assertIsOnPlatform('setNavigationBarVisibility', ['android']);
  return ExpoSystemUI.setNavigationBarVisibility(visibility);
}

/**
 * Changes the Android Navigation Bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setNavigationBarForegroundStyle("light");
 * ```
 */
export function setNavigationBarForegroundStyle(
  style: NavigationBarForegroundStyle
): Promise<void> {
  assertIsOnPlatform('setNavigationBarForegroundStyle', ['android']);
  return ExpoSystemUI.setNavigationBarForegroundStyle(style);
}
/**
 * Gets the Android Navigation Bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const style = await SystemUI.getNavigationBarForegroundStyle();
 * ```
 */
export function getNavigationBarForegroundStyle(): Promise<NavigationBarForegroundStyle> {
  assertIsOnPlatform('getNavigationBarForegroundStyle', ['android']);
  return ExpoSystemUI.getNavigationBarForegroundStyle();
}

/**
 * Changes the Android Status Bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setStatusBarBackgroundColor("white");
 * ```
 */
export function setStatusBarBackgroundColor(color: ColorValue): Promise<void> {
  if (Platform.OS === 'ios') {
    // noop: iOS Status Bar cannot have a background color
    return Promise.resolve();
  }

  assertIsOnPlatform('setStatusBarBackgroundColor', ['android']);
  const colorNumber = processColor(color);
  return ExpoSystemUI.setStatusBarBackgroundColor(colorNumber);
}
/**
 * Gets the Android Status Bar's background color.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const color = await SystemUI.getStatusBarBackgroundColor();
 * ```
 */
export function getStatusBarBackgroundColor(): Promise<ColorValue> {
  if (Platform.OS === 'ios') {
    // iOS Status Bar is always transparent
    return Promise.resolve('transparent');
  }

  assertIsOnPlatform('getStatusBarBackgroundColor', ['android']);
  return ExpoSystemUI.getStatusBarBackgroundColor();
}

/**
 * Changes the Android Status Bar's visibility.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setStatusBarVisibility("hidden");
 * ```
 */
export function setStatusBarVisibility(visibility: StatusBarVisibility): Promise<void> {
  assertIsOnPlatform('setStatusBarVisibility', ['android']);
  return ExpoSystemUI.setStatusBarVisibility(visibility);
}

/**
 * Changes the Android Status Bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * SystemUI.setStatusBarForegroundStyle("light");
 * ```
 */
export function setStatusBarForegroundStyle(style: StatusBarForegroundStyle): Promise<void> {
  assertIsOnPlatform('setStatusBarForegroundStyle', ['android']);
  return ExpoSystemUI.setStatusBarForegroundStyle(style);
}
/**
 * Gets the Android Status Bar's foreground style.
 *
 * @platform android
 *
 * @example
 * ```typescript
 * const style = await SystemUI.getStatusBarForegroundStyle();
 * ```
 */
export function getStatusBarForegroundStyle(): Promise<StatusBarForegroundStyle> {
  assertIsOnPlatform('getStatusBarForegroundStyle', ['android']);
  return ExpoSystemUI.getStatusBarForegroundStyle();
}

/**
 * Sets whether the App should draw behind the Status Bar and Navigation Bar.
 *
 * When drawing behind the Status and Navigation Bar, make sure to adjust the Safe Area Insets accordingly.
 *
 * This is often used in conjunction with `setStatusBarBackgroundColor` and `setNavigationBarBackgroundColor`
 * to enable an "edge-to-edge" mode by making the System UI transparent and letting your App draw beneath.
 *
 * @platform android
 *
 * @example
 * ```ts
 * // enables edge-to-edge mode
 * SystemUI.setDrawsBehindSystemUI(true)
 * // transparent backgrounds to see through
 * SystemUI.setStatusBarBackgroundColor('#ffffff00')
 * SystemUI.setNavigationBarBackgroundColor('#ffffff00')
 * ```
 */
export function setDrawsBehindSystemUI(drawsBehindSystemUI: boolean): Promise<void> {
  assertIsOnPlatform('setDrawsBehindSystemUI', ['android']);
  return ExpoSystemUI.setDrawsBehindSystemUI(drawsBehindSystemUI);
}

/**
 * Gets whether the App draws behind the Status Bar and Navigation Bar.
 *
 * @platform android
 */
export function getDrawsBehindSystemUI(): Promise<boolean> {
  assertIsOnPlatform('getDrawsBehindSystemUI', ['android']);
  return ExpoSystemUI.getDrawsBehindSystemUI();
}

/**
 * Sets the behavior of the Status Bar and Navigation Bar when they are hidden and the user wants to reveal them.
 *
 * For example, if the Navigation Bar is hidden (`setNavigationBarVisibility(false)`) and the System UI behavior
 * is `'overlay-swipe'`, the user can swipe from the bottom of the screen to temporarily reveal the Navigation Bar.
 *
 * * `'overlay-swipe'`: Temporarily reveals the System UI after a swipe gesture (bottom or top) without insetting your App's content.
 * * `'inset-swipe'`: Reveals the System UI after a swipe gesture (bottom or top) and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 * * `'inset-touch'`: Reveals the System UI after a touch anywhere on the screen and insets your App's content (Safe Area). The System UI is visible until you explicitly hide it again.
 *
 * @platform android
 */
export function setSystemUIBehavior(behavior: SystemUIBehavior): Promise<void> {
  assertIsOnPlatform('setSystemUIBehavior', ['android']);
  return ExpoSystemUI.setSystemUIBehavior(behavior);
}

/**
 * Gets the behavior of the Status Bar and Navigation Bar when the user swipes or touches the screen.
 *
 * @platform android
 */
export function getSystemUIBehavior(): Promise<SystemUIBehavior> {
  assertIsOnPlatform('getSystemUIBehavior', ['android']);
  return ExpoSystemUI.getSystemUIBehavior();
}

// FIXME(Marc): Setting appearance crashes on Android because of RNScreens.
//  See `SystemUIModule.kt`'s `setAppearance` function for details.
// /**
//  * Sets the App's appearance.
//  *
//  * @example
//  * ```typescript
//  * SystemUI.setAppearance("dark");
//  * ```
//  */
// setAppearance: (appearance: Appearance): Promise<void> => {
//   assertIsOnPlatform('setAppearance', ['android']);
//   return ExpoSystemUI.setAppearance(appearance);
// },
// /**
//  * Gets the App's appearance.
//  * @example
//  * ```typescript
//  * const appearance = await SystemUI.getAppearance();
//  * ```
//  */
// getAppearance: (): Promise<Appearance> => {
//   assertIsOnPlatform('getAppearance', ['android']);
//   return ExpoSystemUI.getAppearance();
// },
