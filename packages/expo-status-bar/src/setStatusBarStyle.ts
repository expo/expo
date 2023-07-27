import { StatusBar } from 'react-native';

import { StatusBarStyle } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';

// @needsAudit
/**
 * Set the bar style of the status bar.
 * @param style The color of the status bar text.
 * @param animated If the transition should be animated.
 */
export default function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {
  StatusBar.setBarStyle(styleToBarStyle(style), animated);
}
