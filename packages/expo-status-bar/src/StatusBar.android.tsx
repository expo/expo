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
    if (props.backgroundColor) {
      console.warn(
        'StatusBar backgroundColor is not supported with edge-to-edge enabled. Render a view under the status bar to change its background.'
      );
    }

    if (typeof props.translucent !== 'undefined' && Boolean(props.translucent) === false) {
      console.warn(
        'StatusBar is always translucent when edge-to-edge is enabled. The translucent prop is ignored.'
      );
    }
  }

  return <OriginalStatusBar {...props} />;
}

export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {
  return originalSetStatusBarStyle(style, animated);
}

export function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation) {
  return originalSetStatusBarHidden(hidden, animation);
}

export function setStatusBarBackgroundColor(backgroundColor: string, animated?: boolean) {
  if (isEdgeToEdge()) {
    console.warn('`setStatusBarBackgroundColor` is not supported with edge-to-edge enabled.');
    return;
  }

  return originalSetStatusBarBackgroundColor(backgroundColor, animated);
}

export function setStatusBarNetworkActivityIndicatorVisible(visible: boolean) {
  if (isEdgeToEdge()) {
    console.warn(
      '`setStatusBarNetworkActivityIndicatorVisible` is not supported with edge-to-edge enabled.'
    );
    return;
  }

  return originalSetStatusBarNetworkActivityIndicatorVisible(visible);
}

export function setStatusBarTranslucent(translucent: boolean) {
  if (isEdgeToEdge()) {
    console.warn(
      '`setStatusBarTranslucent` is not supported with edge-to-edge enabled. In this case the status bar is always translucent.'
    );
    return;
  }

  return originalSetStatusBarTranslucent(translucent);
}
