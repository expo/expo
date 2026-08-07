'use client';
import { use } from 'react';

import type { NavigationState, ParamListBase, RenderState } from '../routers';
import { CurrentRenderContext } from './CurrentRenderContext';
import type { Descriptor, NavigationHelpers, NavigationProp, RouteProp } from './types';

type Options = {
  state: RenderState<NavigationState>;
  navigation: NavigationHelpers<ParamListBase>;
  descriptors: Record<
    string,
    Descriptor<object, NavigationProp<ParamListBase>, RouteProp<ParamListBase>>
  >;
};

/**
 * Write the current options, so that server renderer can get current values
 * Mutating values like this is not safe in async mode, but it doesn't apply to SSR
 */
export function useCurrentRender({ state, navigation, descriptors }: Options) {
  const current = use(CurrentRenderContext);
  const focusedRoute = state.routes[state.index];

  if (current && focusedRoute && navigation.isFocused()) {
    current.options = descriptors[focusedRoute.key]?.options;
  }
}
