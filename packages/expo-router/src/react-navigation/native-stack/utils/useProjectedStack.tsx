'use client';
import * as React from 'react';

import type { ParamListBase, StackNavigationState } from '../../native';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../types';
import { usePreloadedDescriptors } from './usePreloadedDescriptors';

type DescribeFn = (
  route: StackNavigationState<ParamListBase>['preloadedRoutes'][number],
  placeholder: boolean
) => NativeStackDescriptor;

/**
 * Projects preloaded routes as regular routes after `index`, with descriptors covering them.
 * `NativeStackView` treats any route positioned after the focused one as preloaded.
 */
export function useProjectedStack(
  state: StackNavigationState<ParamListBase>,
  descriptors: NativeStackDescriptorMap,
  describe: DescribeFn
) {
  const projectedState = React.useMemo(
    () => ({
      ...state,
      routes: [...state.routes, ...state.preloadedRoutes],
    }),
    [state]
  );
  const projectedDescriptors = usePreloadedDescriptors(
    state.preloadedRoutes,
    descriptors,
    describe
  );
  return { projectedState, projectedDescriptors };
}
