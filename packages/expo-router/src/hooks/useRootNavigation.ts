'use client';

import { store } from '../global-state/store';

/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
export function useRootNavigation() {
  return store.navigationRef.current;
}
