import { createNavigationContainerRef } from '../react-navigation/core/createNavigationContainerRef';
import type { NavigationContainerRef } from '../react-navigation/core/types';

// TODO(@ubax): scope this module-level mutable state to each navigation container
export const navigationRef = createNavigationContainerRef<ReactNavigation.RootParamList>();

export function setNavigationRef(
  navigation: NavigationContainerRef<ReactNavigation.RootParamList> | null
) {
  navigationRef.current = navigation;
  return () => {
    // A newer root may own `navigationRef` now. An Android Activity relaunch unmounts the old root last.
    if (navigationRef.current === navigation) {
      navigationRef.current = null;
    }
  };
}
