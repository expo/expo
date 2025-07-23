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

// This line only imports the type information for TypeScript type checking.  It
// doesn't import the actual module in the compiled JavaScript code.  The actual
// module is imported conditionally with require() below, in order to avoid
// importing the module if edge-to-edge is not enabled (which could throw if
// it's not linked).
let SystemBars: typeof import('react-native-edge-to-edge').SystemBars | null = null;

if (isEdgeToEdge()) {
  SystemBars = require('react-native-edge-to-edge').SystemBars;
}

export function StatusBar(props: StatusBarProps) {
  if (isEdgeToEdge() && SystemBars) {
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

    return <SystemBars style={{ statusBar: props.style }} hidden={{ statusBar: props.hidden }} />;
  }

  return <OriginalStatusBar {...props} />;
}

export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {
  if (isEdgeToEdge()) {
    SystemBars?.setStyle({ statusBar: style });
    return;
  }

  return originalSetStatusBarStyle(style, animated);
}

export function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation) {
  if (isEdgeToEdge()) {
    SystemBars?.setHidden({ statusBar: hidden });
    return;
  }

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
