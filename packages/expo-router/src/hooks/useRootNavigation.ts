'use client';

import { store } from '../global-state/store';

/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead. This hook
 * returns the navigation container synchronously, so it is `null` on the first render before the
 * container is ready and does not re-render when the container mounts. `useNavigationContainerRef`
 * returns a stable `ref` whose `current` is populated once mounting completes, which avoids these
 * timing issues.
 */
export function useRootNavigation() {
  return store.navigationRef.current;
}
