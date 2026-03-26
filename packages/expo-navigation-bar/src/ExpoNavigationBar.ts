import type { EventSubscription } from 'expo-modules-core';

import type { NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';

export default {} as {
  addListener: (
    event: 'ExpoNavigationBar.didChange',
    listener: (event: NavigationBarVisibilityEvent) => void
  ) => EventSubscription;

  setButtonStyleAsync: (style: 'light' | 'dark') => Promise<void>;

  setVisibilityAsync: (visibility: NavigationBarVisibility) => Promise<void>;
  getVisibilityAsync: () => Promise<NavigationBarVisibility>;
};
