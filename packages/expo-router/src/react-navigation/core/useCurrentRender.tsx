'use client';
import { use } from 'react';

import type { NavigationState, ParamListBase } from '../routers';
import { CurrentRenderContext } from './CurrentRenderContext';
import type { Descriptor, NavigationProp, RouteProp } from './types';
import { useIsRouteFocused } from './useIsFocused';

type Options = {
  state: NavigationState;
  descriptors: Record<
    string,
    Descriptor<object, NavigationProp<ParamListBase>, RouteProp<ParamListBase>>
  >;
};

/**
 * Write the current options, so that server renderer can get current values
 * Mutating values like this is not safe in async mode, but it doesn't apply to SSR
 */
export function useCurrentRender({ state, descriptors }: Options) {
  const current = use(CurrentRenderContext);
  const focusedRoute = state.routes[state.index];
  const isFocused = useIsRouteFocused(undefined);

  if (current && focusedRoute && isFocused) {
    current.options = descriptors[focusedRoute.key]?.options;
  }
}
