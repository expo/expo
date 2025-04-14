import { Platform } from 'react-native';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

import { setVisibilityAsync as originalSetVisibilityAsync } from './NativeNavigationBarWrapper';
import { NavigationBarStyle, NavigationBarVisibility } from './NavigationBar.types';

export * from './NavigationBar.types';

// This line only imports the type information for TypeScript type checking.  It
// doesn't import the actual module in the compiled JavaScript code.  The actual
// module is imported conditionally with require() below, in order to avoid
// importing the module if edge-to-edge is not enabled (which could throw if
// it's not linked).
let SystemBars: typeof import('react-native-edge-to-edge').SystemBars | null = null;

if (isEdgeToEdge() && Platform.OS === 'android') {
  SystemBars = require('react-native-edge-to-edge').SystemBars;
}

// MARK: react-native-edge-to-edge based APIs
/**
 * Sets the style of the navigation bar.
 * > This is only supported on Android when edge-to-edge is enabled.
 */
export function setStyle(style: NavigationBarStyle) {
  if (!isEdgeToEdge() && Platform.OS === 'android') {
    console.warn(
      '`setStyle` is only supported on Android when edge-to-edge is enabled. Enable edge-to-edge or use the `setButtonStyle` function instead.'
    );
    return;
  }
  if (Platform.OS !== 'android') {
    console.warn('`setStyle` method is only available on Android');
    return;
  }
  SystemBars?.setStyle({ navigationBar: style });
}

/**
 * Set the navigation bar's visibility.
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 * @param visibility Based on CSS visibility property.
 */
export function setVisibilityAsync(visibility: NavigationBarVisibility) {
  if (Platform.OS !== 'android') {
    console.warn('`setVisibilityAsync` method is only available on Android');
    return;
  }

  if (isEdgeToEdge() && SystemBars) {
    return SystemBars.setHidden({ navigationBar: visibility === 'hidden' });
  }

  return originalSetVisibilityAsync(visibility);
}

// MARK: existing expo-navigation-bar APIs

export {
  addVisibilityListener,
  setBackgroundColorAsync,
  getBackgroundColorAsync,
  setBorderColorAsync,
  getVisibilityAsync,
  setButtonStyleAsync,
  getButtonStyleAsync,
  setPositionAsync,
  unstable_getPositionAsync,
  setBehaviorAsync,
  getBehaviorAsync,
  useVisibility,
  getBorderColorAsync,
} from './NativeNavigationBarWrapper';
