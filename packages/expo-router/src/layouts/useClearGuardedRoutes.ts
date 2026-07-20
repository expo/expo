'use client';

import { use, useEffect } from 'react';

import { CommonActions } from '../react-navigation/native';
import {
  getRoutesForRouteNames,
  type ParamListBase,
  type StackNavigationState,
} from '../react-navigation/routers';
import type { Href } from '../types';
import { GuardContext } from './GuardContext';

function isGuardedRouteName(guards: Map<string, Href>, name: string): boolean {
  return guards.has(name) || guards.has(name.replace(/\/index$/, ''));
}

/**
 * Lets a stack navigator clear its own guarded routes from history, based on the guard context.
 */
export function useClearGuardedRoutes(
  state: StackNavigationState<ParamListBase>,
  navigation: {
    dispatch: (
      action: Readonly<{ type: string; payload?: object; source?: string; target?: string }>
    ) => void;
  }
) {
  const guards = use(GuardContext);

  useEffect(() => {
    if (!guards) {
      return;
    }

    const focusedName = state.routes[state.index]?.name;
    // If focused route becomes guarded then we let the redirect fire
    const hasGuardedRoute = state.routes.some(
      (route) => route.name !== focusedName && isGuardedRouteName(guards, route.name)
    );
    if (!hasGuardedRoute) {
      return;
    }

    const allowedNames = state.routeNames.filter(
      (name) => name === focusedName || !isGuardedRouteName(guards, name)
    );

    const { routes, index } = getRoutesForRouteNames(state, allowedNames, { routeParamList: {} });

    navigation.dispatch({
      ...CommonActions.reset({ ...state, routes, index }),
      target: state.key,
    });
  }, [guards, state, navigation]);
}
