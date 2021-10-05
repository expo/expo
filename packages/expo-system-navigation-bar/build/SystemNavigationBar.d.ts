import { Subscription } from 'expo-modules-core';
import { ColorValue } from 'react-native';
import { Appearance, Visibility, Behavior, Position } from './SystemNavigationBar.types';
declare type VisibilityEvent = {
    state: number;
    visibility: 'visible' | 'hidden';
};
export declare function addVisibilityListener(listener: (event: VisibilityEvent) => void): Subscription;
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
export declare function setBackgroundColorAsync(color: ColorValue): Promise<void>;
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
export declare function getBackgroundColorAsync(): Promise<ColorValue>;
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
export declare function setBorderColorAsync(color: ColorValue): Promise<void>;
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
export declare function getBorderColorAsync(): Promise<ColorValue | null>;
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
export declare function setVisibilityAsync(visibility: Visibility): Promise<void>;
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
export declare function getVisibilityAsync(): Promise<Visibility>;
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
export declare function setAppearanceAsync(style: Appearance): Promise<void>;
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
export declare function getAppearanceAsync(): Promise<Appearance>;
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
export declare function setPositionAsync(position: Position): Promise<void>;
/**
 * Whether the navigation and status bars float above the app (absolute) or sit inline with it (relative).
 *
 * @platform android
 */
export declare function getPositionAsync(): Promise<Position>;
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
export declare function setBehaviorAsync(behavior: Behavior): Promise<void>;
/**
 * Gets the behavior of the status and navigation bars when the user swipes or touches the screen.
 *
 * @platform android
 */
export declare function getBehaviorAsync(): Promise<Behavior>;
export * from './SystemNavigationBar.types';
export declare function useVisibility(): Visibility | null;
