'use client';

import { navigationRef } from '../global-state/navigationRef';

/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
export function useNavigationContainerRef() {
  // TODO(@ubax): migrate this to NavigationContainerRefContext without changing the public return type
  return navigationRef;
}
