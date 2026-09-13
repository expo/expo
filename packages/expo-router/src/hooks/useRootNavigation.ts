'use client';

import { use } from 'react';

import { NavigationContainerRefContext } from '../react-navigation/native';

/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
export function useRootNavigation() {
  return use(NavigationContainerRefContext) ?? null;
}
