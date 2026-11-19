'use client';

import { useMemo } from 'react';

import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { useStateForPath } from '../react-navigation/native';

/**
 * Returns route info for a screen it is called from.
 *
 * @experimental
 */
export function useCurrentRouteInfo() {
  const state = useStateForPath();
  return useMemo(() => (state ? getRouteInfoFromState(state) : undefined), [state]);
}
