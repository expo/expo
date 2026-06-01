'use client';

import { use } from 'react';

import { RouteInfoContext } from '../global-state/RouteInfoContext';

/**
 * Returns route info for a screen it is called from.
 *
 * @experimental
 */
export function useCurrentRouteInfo() {
  return use(RouteInfoContext);
}
