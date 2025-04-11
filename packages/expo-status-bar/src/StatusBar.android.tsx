import { SystemBars } from 'react-native-edge-to-edge';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

import {
  StatusBar as OriginalStatusBar,
  setStatusBarStyle as originalSetStatusBarStyle,
  setStatusBarHidden as originalSetStatusBarHidden,
  setStatusBarBackgroundColor as originalSetStatusBarBackgroundColor,
  setStatusBarNetworkActivityIndicatorVisible as originalSetStatusBarNetworkActivityIndicatorVisible,
  setStatusBarTranslucent as originalSetStatusBarTranslucent,
} from './NativeStatusBarWrapper';
import { StatusBarAnimation, StatusBarProps, StatusBarStyle } from './types';

export function StatusBar(props: StatusBarProps) {
  if (isEdgeToEdge()) {
    return (
      <SystemBars
        style={{ statusBar: props.style, navigationBar: undefined }}
        hidden={{ statusBar: props.hidden, navigationBar: undefined }}
      />
    );
  }

  return <OriginalStatusBar {...props} />;
}

export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {
  if (isEdgeToEdge()) {
    console.warn(
      'setStatusBarStyle is not supported with edge-to-edge enabled. Use the StatusBar component instead.'
    );
    return;
  }

  return originalSetStatusBarStyle(style, animated);
}

export function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation) {
  if (isEdgeToEdge()) {
    console.warn(
      'setStatusBarHidden is not supported with edge-to-edge enabled. Use the StatusBar component instead.'
    );
    return;
  }

  return originalSetStatusBarHidden(hidden, animation);
}

export function setStatusBarBackgroundColor(backgroundColor: string, animated?: boolean) {
  if (isEdgeToEdge()) {
    console.warn(
      'setStatusBarBackgroundColor is not supported with edge-to-edge enabled. Use the StatusBar component instead.'
    );
    return;
  }

  return originalSetStatusBarBackgroundColor(backgroundColor, animated);
}

export function setStatusBarNetworkActivityIndicatorVisible(visible: boolean) {
  if (isEdgeToEdge()) {
    console.warn(
      'setStatusBarNetworkActivityIndicatorVisible is not supported with edge-to-edge enabled. Use the StatusBar component instead.'
    );
    return;
  }

  return originalSetStatusBarNetworkActivityIndicatorVisible(visible);
}

export function setStatusBarTranslucent(translucent: boolean) {
  if (isEdgeToEdge()) {
    console.warn(
      'setStatusBarTranslucent is not supported with edge-to-edge enabled. Use the StatusBar component instead.'
    );
    return;
  }

  return originalSetStatusBarTranslucent(translucent);
}
