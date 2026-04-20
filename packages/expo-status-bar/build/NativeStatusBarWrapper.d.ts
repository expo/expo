import React from 'react';
import { StatusBarProps, StatusBarStyle, StatusBarAnimation } from './types';
/**
 * A component that allows you to configure your status bar declaratively.
 *
 * You will likely have multiple `StatusBar` components mounted in the same app at the same time.
 * For example, if you have multiple screens in your app, you may end up using one per screen.
 * The props of each `StatusBar` component will be merged in the order that they were mounted.
 * This component is built on top of the [StatusBar](https://reactnative.dev/docs/statusbar)
 * component exported from React Native, and it provides defaults that work better for Expo users.
 */
export declare function StatusBar({ style, hideTransitionAnimation, animated, hidden }: StatusBarProps): React.JSX.Element;
export declare namespace StatusBar {
    var setStyle: (style: StatusBarStyle, animated?: boolean) => void;
    var setHidden: (hidden: boolean, animation?: StatusBarAnimation) => void;
}
/**
 * @deprecated Use `StatusBar.setStyle` instead. This will be removed in a future release.
 */
export declare const setStatusBarStyle: (style: StatusBarStyle, animated?: boolean) => void;
/**
 * @deprecated Use `StatusBar.setHidden` instead. This will be removed in a future release.
 */
export declare const setStatusBarHidden: (hidden: boolean, animation?: StatusBarAnimation) => void;
//# sourceMappingURL=NativeStatusBarWrapper.d.ts.map