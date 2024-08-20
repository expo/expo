import { StatusBar } from 'react-native';

import type { StatusBarStyle } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';

// @needsAudit
/**
 * Set the bar style of the status bar.
 * @param style The color of the status bar text.
 * @param animated If the transition should be animated.
 */
export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {
  StatusBar.setBarStyle(styleToBarStyle(style), animated);
}

// @needsAudit
/**
 * Toggle visibility of the status bar.
 * @param hidden If the status bar should be hidden.
 * @param animation Animation to use when toggling hidden, defaults to `'none'`.
 */
export const setStatusBarHidden = StatusBar.setHidden;

// @needsAudit
/**
 * Set the background color of the status bar.
 * @param backgroundColor The background color of the status bar.
 * @param animated `true` to animate the background color change, `false` to change immediately.
 * @platform android
 */
export const setStatusBarBackgroundColor = StatusBar.setBackgroundColor;

// @needsAudit
/**
 * Toggle visibility of the network activity indicator.
 * @param visible If the network activity indicator should be visible.
 * @platform ios
 */
export const setStatusBarNetworkActivityIndicatorVisible =
  StatusBar.setNetworkActivityIndicatorVisible;

// @needsAudit
/**
 * Set the translucency of the status bar.
 * @param translucent Whether the app can draw under the status bar. When `true`, content will be
 * rendered under the status bar. This is always `true` on iOS and cannot be changed.
 * @platform android
 */
export const setStatusBarTranslucent = StatusBar.setTranslucent;

export * from './StatusBar.types';

export { default as StatusBar } from './ExpoStatusBar';
