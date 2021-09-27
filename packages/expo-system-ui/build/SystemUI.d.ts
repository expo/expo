import { ColorValue } from 'react-native';
export declare type SystemUIBehavior = 'overlay-swipe' | 'inset-swipe' | 'inset-touch';
export declare type NavigationBarForegroundStyle = 'light' | 'dark';
export declare type NavigationBarVisibility = 'visible' | 'hidden';
export declare type StatusBarForegroundStyle = 'light' | 'dark';
export declare type StatusBarVisibility = 'visible' | 'hidden';
/**
 * * "light": Light Mode
 * * "dark": Dark/Night Mode
 * * "auto": Follow System mode, automatically switch to dark mode.
 * * "unspecified": Default
 */
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
export declare function setNavigationBarBackgroundColor(color: ColorValue): Promise<void>;
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
export declare function getNavigationBarBackgroundColor(): Promise<ColorValue>;
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
export declare function setNavigationBarDividerColor(color: ColorValue): Promise<void>;
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
export declare function getNavigationBarDividerColor(): Promise<ColorValue>;
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
export declare function setNavigationBarVisibility(visibility: NavigationBarVisibility): Promise<void>;
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
export declare function setNavigationBarForegroundStyle(style: NavigationBarForegroundStyle): Promise<void>;
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
export declare function getNavigationBarForegroundStyle(): Promise<NavigationBarForegroundStyle>;
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
export declare function setStatusBarBackgroundColor(color: ColorValue): Promise<void>;
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
export declare function getStatusBarBackgroundColor(): Promise<ColorValue>;
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
export declare function setStatusBarVisibility(visibility: StatusBarVisibility): Promise<void>;
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
export declare function setStatusBarForegroundStyle(style: StatusBarForegroundStyle): Promise<void>;
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
export declare function getStatusBarForegroundStyle(): Promise<StatusBarForegroundStyle>;
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
export declare function setDrawsBehindSystemUI(drawsBehindSystemUI: boolean): Promise<void>;
/**
 * Gets whether the App draws behind the Status Bar and Navigation Bar.
 *
 * @platform android
 */
export declare function getDrawsBehindSystemUI(): Promise<boolean>;
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
export declare function setSystemUIBehavior(behavior: SystemUIBehavior): Promise<void>;
/**
 * Gets the behavior of the Status Bar and Navigation Bar when the user swipes or touches the screen.
 *
 * @platform android
 */
export declare function getSystemUIBehavior(): Promise<SystemUIBehavior>;
