'use client';

import { useMemo } from 'react';

import { getCachedRouteInfo } from '../global-state/routeInfoCache';
import { useStateForPath } from '../react-navigation/native';

/**
 * Returns route info for a screen it is called from.
 *
 * @experimental
 */
export function useCurrentRouteInfo() {
  const state = useStateForPath();
  const routeInfo = useMemo(() => (state ? getCachedRouteInfo(state) : undefined), [state]);
  return routeInfo;
}
