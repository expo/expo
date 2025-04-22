import React from 'react';
import { type ColorValue } from 'react-native';
import { StatusBarProps, StatusBarStyle, StatusBarAnimation } from './types';
/**
 * A component that allows you to configure your status bar without directly calling imperative
 * methods like `setBarStyle`.
 *
 * You will likely have multiple `StatusBar` components mounted in the same app at the same time.
 * For example, if you have multiple screens in your app, you may end up using one per screen.
 * The props of each `StatusBar` component will be merged in the order that they were mounted.
 * This component is built on top of the [StatusBar](https://reactnative.dev/docs/statusbar)
 * component exported from React Native, and it provides defaults that work better for Expo users.
 */
export declare function StatusBar({ style, hideTransitionAnimation, translucent, backgroundColor: backgroundColorProp, ...props }: StatusBarProps): React.JSX.Element;
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
export declare function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation): void;
/**
 * Set the background color of the status bar.
 * @param backgroundColor The background color of the status bar.
 * @param animated `true` to animate the background color change, `false` to change immediately.
 * @platform android
 */
export declare function setStatusBarBackgroundColor(backgroundColor: ColorValue, animated?: boolean): void;
/**
 * Toggle visibility of the network activity indicator.
 * @param visible If the network activity indicator should be visible.
 * @platform ios
 */
export declare function setStatusBarNetworkActivityIndicatorVisible(visible: boolean): void;
/**
 * Set the translucency of the status bar.
 * @param translucent Whether the app can draw under the status bar. When `true`, content will be
 * rendered under the status bar. This is always `true` on iOS and cannot be changed.
 * @platform android
 */
export declare function setStatusBarTranslucent(translucent: boolean): void;
//# sourceMappingURL=NativeStatusBarWrapper.d.ts.map