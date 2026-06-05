'use client';
import * as React from 'react';

import type { ParamListBase, StackNavigationState } from '../../native';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../types';

type DescribeFn = (
  route: StackNavigationState<ParamListBase>['preloadedRoutes'][number],
  placeholder: boolean
) => NativeStackDescriptor;

/**
 * Extends the descriptors map with descriptors for the preloaded routes, which
 * `useNavigationBuilder` does not describe.
 */
export function usePreloadedDescriptors(
  preloadedRoutes: StackNavigationState<ParamListBase>['preloadedRoutes'],
  descriptors: NativeStackDescriptorMap,
  describe: DescribeFn
): NativeStackDescriptorMap {
  return React.useMemo(() => {
    if (preloadedRoutes.length === 0) {
      return descriptors;
    }
    const result = { ...descriptors };
    for (const route of preloadedRoutes) {
      result[route.key] = result[route.key] ?? describe(route, true);
    }
    return result;
  }, [descriptors, preloadedRoutes, describe]);
}
