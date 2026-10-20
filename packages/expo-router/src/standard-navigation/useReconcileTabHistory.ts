'use client';

import { use } from 'react';

import { useRouteNode } from '../Route';
import { findStateByKey } from '../global-state/stateUtils';
import { hasBackTarget } from '../react-navigation/core/CanGoBackContext';
import { NavigationHelpersContext } from '../react-navigation/core/NavigationHelpersContext';
import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
import type { NavigationHelpers } from '../react-navigation/core/types';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import type { NavigationState, ParamListBase, TabRouterOptions } from '../react-navigation/native';
import { getValidInitialRouteName } from '../routeNode';
import { useWarnOnce } from '../useDeprecated';

export function useReconcileTabHistory(
  backBehavior: TabRouterOptions['backBehavior'],
  navigator?: { state: NavigationState; navigation: NavigationHelpers<ParamListBase> }
) {
  const routeNode = useRouteNode();
  const anchor = getValidInitialRouteName(routeNode);
  const contextKey = routeNode?.contextKey;
  const state = navigator?.state ?? use(NavigatorStateContext);
  const navigation = navigator?.navigation ?? use(NavigationHelpersContext);
  const rootState = use(RootNavigationStateContext);
  if (!state || !navigation) {
    throw new Error('useReconcileTabHistory must be called inside a tab navigator.');
  }

  useWarnOnce(
    `Layout "${contextKey}" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
      'so `useCanGoBack()` can return `true` on the first render. ' +
      'Remove the anchor or use a different `backBehavior`.',
    backBehavior === 'none' && anchor !== undefined
  );

  // Writes the router's back history into root state when root state reports a different `canGoBack`.
  useClientLayoutEffect(() => {
    // Compare with the root-state slice that `useNavigationBuilder` derives `state` from.
    const committed = rootState && findStateByKey(rootState, state.key);
    // `useNavigationBuilder` resets foreign types and dispatches route-name changes, which also
    // normalize history.
    if (
      !committed ||
      committed.type !== state.type ||
      !isArrayEqual(committed.routeNames, state.routeNames)
    ) {
      return;
    }
    if (hasBackTarget(committed) === hasBackTarget(state)) {
      return;
    }
    navigation.dispatch({
      type: 'ROUTE_NAMES_CHANGED',
      payload: { routeNames: state.routeNames },
      target: committed.key,
    });
  }, [navigation, rootState, state]);
}
