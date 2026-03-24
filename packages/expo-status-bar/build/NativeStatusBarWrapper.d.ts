import React from 'react';
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
export declare function StatusBar({ style, hideTransitionAnimation, animated, hidden }: StatusBarProps): React.JSX.Element;
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
//# sourceMappingURL=NativeStatusBarWrapper.d.ts.map