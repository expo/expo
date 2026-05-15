import type { EventSubscription } from 'expo-modules-core';

import type { NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';

export default {} as {
  addListener: (
    event: 'ExpoNavigationBar.didChange',
    listener: (event: NavigationBarVisibilityEvent) => void
  ) => EventSubscription;

  setStyle: (style: 'light' | 'dark') => Promise<void>;
  setHidden: (hidden: boolean) => Promise<void>;
  getVisibilityAsync: () => Promise<NavigationBarVisibility>;
};
