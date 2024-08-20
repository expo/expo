import type { StatusBarStyle } from './StatusBar.types';
/**
 * Set the bar style of the status bar.
 * @param style The color of the status bar text.
 * @param animated If the transition should be animated.
 */
export declare function setStatusBarStyle(style: StatusBarStyle, animated?: boolean): void;
/**
 * Toggle visibility of the status bar.
 * @param hidden If the status bar should be hidden.
 * @param animation Animation to use when toggling hidden, defaults to `'none'`.
 */
export declare const setStatusBarHidden: (hidden: boolean, animation?: import("react-native").StatusBarAnimation | undefined) => void;
/**
 * Set the background color of the status bar.
 * @param backgroundColor The background color of the status bar.
 * @param animated `true` to animate the background color change, `false` to change immediately.
 * @platform android
 */
export declare const setStatusBarBackgroundColor: (color: import("react-native").ColorValue, animated?: boolean | undefined) => void;
/**
 * Toggle visibility of the network activity indicator.
 * @param visible If the network activity indicator should be visible.
 * @platform ios
 */
export declare const setStatusBarNetworkActivityIndicatorVisible: (visible: boolean) => void;
/**
 * Set the translucency of the status bar.
 * @param translucent Whether the app can draw under the status bar. When `true`, content will be
 * rendered under the status bar. This is always `true` on iOS and cannot be changed.
 * @platform android
 */
export declare const setStatusBarTranslucent: (translucent: boolean) => void;
export * from './StatusBar.types';
export { default as StatusBar } from './ExpoStatusBar';
//# sourceMappingURL=StatusBar.d.ts.map