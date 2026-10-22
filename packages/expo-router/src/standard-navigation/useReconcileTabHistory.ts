'use client';

import { use } from 'react';

import { findStateByKey } from '../global-state/stateUtils';
import { hasBackTarget } from '../react-navigation/core/CanGoBackContext';
import { NavigationHelpersContext } from '../react-navigation/core/NavigationHelpersContext';
import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
import type { NavigationHelpers } from '../react-navigation/core/types';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import type { NavigationState, ParamListBase } from '../react-navigation/native';

/**
 * Saves the tab that Back goes to in the `history` of the navigation state, which
 * `useRootNavigationState` and `navigation.getState()` return. Call it once in the content of a
 * custom navigator that uses `TabRouter`. The built-in tab and drawer navigators already call it.
 *
 * @param navigator The `state` and `navigation` of the navigator. Pass them when the hook runs
 * outside the navigator's `NavigationContent`. Defaults to the closest navigator.
 *
 * @example
 * ```tsx
 * import { unstable_useReconcileTabHistory } from 'expo-router';
 *
 * function MyTabsContent({ state, descriptors }) {
 *   unstable_useReconcileTabHistory();
 *   // ...
 * }
 * ```
 */
export function useReconcileTabHistory(navigator?: {
  state: NavigationState;
  navigation: NavigationHelpers<ParamListBase>;
}) {
  const state = navigator?.state ?? use(NavigatorStateContext);
  const navigation = navigator?.navigation ?? use(NavigationHelpersContext);
  const rootState = use(RootNavigationStateContext);
  if (!state || !navigation) {
    throw new Error(
      'Could not reconcile the tab history because `unstable_useReconcileTabHistory` found no navigator. ' +
        'Call it inside the content of a tab navigator, or pass the navigator `state` and `navigation`.'
    );
  }

  // `useNavigationBuilder` derives `state` from this root-state slice.
  const committed = rootState && findStateByKey(rootState, state.key);

  // Writes the derived history only when Back has a target, so a navigator that opens on its first
  // tab does not render again.
  useClientLayoutEffect(() => {
    // `useNavigationBuilder` resets foreign types and dispatches route-name changes, which also
    // normalize history.
    if (
      !committed ||
      committed.type !== state.type ||
      !isArrayEqual(committed.routeNames, state.routeNames) ||
      committed.history != null ||
      (!hasBackTarget(committed) && !hasBackTarget(state))
    ) {
      return;
    }
    navigation.dispatch({
      type: 'ROUTE_NAMES_CHANGED',
      payload: { routeNames: state.routeNames },
      target: committed.key,
    });
  }, [committed, navigation, state]);
}
