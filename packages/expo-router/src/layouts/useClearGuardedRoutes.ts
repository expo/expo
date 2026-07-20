'use client';

import { use, useEffect } from 'react';

import { CommonActions } from '../react-navigation/native';
import {
  getActiveRoutes,
  getInactiveRoutes,
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
    // Only the active history (routes up to and including the focused index) is cleared. Routes
    // after the index are preloaded/inactive: they never show on back navigation, and a guarded
    // one redirects via its own screen when focused. If the focused route itself becomes guarded,
    // we let the redirect fire instead of clearing it.
    const activeRoutes = getActiveRoutes(state);
    const hasGuardedRoute = activeRoutes.some(
      (route) => route.name !== focusedName && isGuardedRouteName(guards, route.name)
    );
    if (!hasGuardedRoute) {
      return;
    }

    const allowedActiveRoutes = activeRoutes.filter(
      (route) => route.name === focusedName || !isGuardedRouteName(guards, route.name)
    );

    navigation.dispatch({
      ...CommonActions.reset({
        ...state,
        routes: [...allowedActiveRoutes, ...getInactiveRoutes(state)],
        index: allowedActiveRoutes.length - 1,
      }),
      target: state.key,
    });
  }, [guards, state, navigation]);
}
