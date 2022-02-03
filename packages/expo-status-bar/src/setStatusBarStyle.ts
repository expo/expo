import { StatusBar } from 'react-native';

import { StatusBarStyle } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';

// @needsAudit
/**
 * Set the bar style of the status bar.
 * @param style The color of the status bar text.
 */
export default function setStatusBarStyle(style: StatusBarStyle) {
  StatusBar.setBarStyle(styleToBarStyle(style));
}
