'use client';

import { use, useEffect } from 'react';

import { CommonActions } from '../react-navigation/native';
import {
  getRoutesForRouteNames,
  type ParamListBase,
  type StackNavigationState,
} from '../react-navigation/routers';
import { GuardContext, isRouteGuarded } from './GuardContext';

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
      (route) => route.name !== focusedName && isRouteGuarded(route.name, guards)
    );
    if (!hasGuardedRoute) {
      return;
    }

    const allowedNames = state.routeNames.filter(
      (name) => name === focusedName || !isRouteGuarded(name, guards)
    );

    const { routes, index } = getRoutesForRouteNames(state, allowedNames, { routeParamList: {} });

    navigation.dispatch({
      ...CommonActions.reset({ ...state, routes, index }),
      target: state.key,
    });
  }, [guards, state, navigation]);
}
