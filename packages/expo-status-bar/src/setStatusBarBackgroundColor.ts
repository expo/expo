import { StatusBar } from 'react-native';

// @needsAudit
/**
 * Set the background color of the status bar.
 * @param backgroundColor The background color of the status bar.
 * @param animated `true` to animate the background color change, `false` to change immediately.
 * @platform android
 */
export default function setStatusBarBackgroundColor(backgroundColor: string, animated: boolean) {
  StatusBar.setBackgroundColor(backgroundColor, animated);
}
