'use client';

import { useMemo } from 'react';

import { getCachedRouteInfo } from '../global-state/routeInfoCache';
import { useStateForPath } from '../react-navigation/native';

/**
 * Returns route info for the screen this hook is called from, including its `pathname`,
 * `params`, `segments`, and `searchParams`. Returns `undefined` before the navigation state
 * for the screen is available.
 *
 * Unlike `useRouteInfo`, which reflects the globally active route, this hook reflects the
 * screen that renders it. Use it in a screen that may not be focused, for example a screen
 * kept mounted underneath another in a stack. Prefer `useRouteInfo` when you want the currently
 * active route regardless of where the hook is called.
 *
 * @experimental
 */
export function useCurrentRouteInfo() {
  const state = useStateForPath();
  const routeInfo = useMemo(() => (state ? getCachedRouteInfo(state) : undefined), [state]);
  return routeInfo;
}
