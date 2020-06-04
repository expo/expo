import { StatusBarProps, StatusBarAnimation, StatusBarStyle } from 'react-native';

import StatusBar from './ExpoStatusBar';

const setBackgroundColor = StatusBar.setBackgroundColor;
const setBarStyle = StatusBar.setBarStyle;
const setHidden = StatusBar.setHidden;
const setNetworkActivityIndicatorVisible = StatusBar.setNetworkActivityIndicatorVisible;
const setTranslucent = StatusBar.setTranslucent;

export {
  StatusBar,
  StatusBarProps,
  StatusBarAnimation,
  StatusBarStyle,
  setBarStyle,
  setBackgroundColor,
  setHidden,
  setNetworkActivityIndicatorVisible,
  setTranslucent,
};
