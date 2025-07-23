import type { EventSubscription } from 'expo-modules-core';
import type { processColor } from 'react-native';

import type {
  NavigationBarBehavior,
  NavigationBarButtonStyle,
  NavigationBarPosition,
  NavigationBarVisibility,
  NavigationBarVisibilityEvent,
} from './NavigationBar.types';

export default {} as {
  addListener: (
    event: 'ExpoNavigationBar.didChange',
    listener: (event: NavigationBarVisibilityEvent) => void
  ) => EventSubscription;

  setBackgroundColorAsync: (color: ReturnType<typeof processColor>) => Promise<void>;
  getBackgroundColorAsync: () => Promise<string>;

  setBehaviorAsync: (behavior: NavigationBarBehavior) => Promise<void>;
  getBehaviorAsync: () => Promise<NavigationBarBehavior>;

  setBorderColorAsync: (color: ReturnType<typeof processColor>) => Promise<void>;
  getBorderColorAsync: () => Promise<string>;

  setButtonStyleAsync: (style: NavigationBarButtonStyle) => Promise<void>;
  getButtonStyleAsync: () => Promise<NavigationBarButtonStyle>;

  setPositionAsync: (position: NavigationBarPosition) => Promise<void>;
  unstable_getPositionAsync: () => Promise<NavigationBarPosition>;

  setVisibilityAsync: (visibility: NavigationBarVisibility) => Promise<void>;
  getVisibilityAsync: () => Promise<NavigationBarVisibility>;
};
