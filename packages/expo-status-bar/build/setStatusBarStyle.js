import { StatusBar } from 'react-native';
import styleToBarStyle from './styleToBarStyle';
// @needsAudit
/**
 * Set the bar style of the status bar.
 * @param style The color of the status bar text.
 */
export default function setStatusBarStyle(style) {
    StatusBar.setBarStyle(styleToBarStyle(style));
}
//# sourceMappingURL=setStatusBarStyle.js.map