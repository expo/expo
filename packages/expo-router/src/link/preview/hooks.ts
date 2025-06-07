import {
  NavigationState,
  ParamListBase,
  PartialState,
  StackNavigationState,
} from '@react-navigation/native';
import isEqual from 'fast-deep-equal';
import { useCallback, useMemo, useState } from 'react';

import { getParamsAndNodeFromHref } from './Preview';
import { useRouter } from '../../hooks';
import { Href } from '../../types';
import { useNavigation } from '../../useNavigation';

export function useScreenPreload(href: Href) {
  const navigation = useNavigation();
  const router = useRouter();
  const [navigationKey, setNavigationKey] = useState<string | undefined>();

  const { params, routeNode } = useMemo(() => getParamsAndNodeFromHref(href), [href]);

  // TODO: check if this can be done with listener to navigation state
  const updateNavigationKey = useCallback((): void => {
    const state = getLeafState(navigation.getState());

    if (state?.type !== 'stack') {
      console.warn('Peek and Pop only supports stack navigators');
      return;
    }

    const castedState = state as StackNavigationState<ParamListBase>;

    const routeKey = castedState.preloadedRoutes?.find((r) => {
      // TODO: find out if this is correct solution. This is to cover cases of (.......)/index
      if (r.params && 'screen' in r.params && 'params' in r.params) {
        return r.params.screen === routeNode?.route && isEqual(r.params.params, params);
      }
      return r.name === routeNode?.route && isEqual(r.params, params);
    })?.key;

    setNavigationKey(routeKey);
  }, [params, routeNode]);
  const preload = useCallback(() => {
    router.prefetch(href);
  }, [href]);

  return {
    preload,
    updateNavigationKey,
    navigationKey,
  };
}

function getLeafState(
  state: NavigationState | PartialState<NavigationState> | undefined
): PartialState<NavigationState> | NavigationState | undefined {
  if (state && state.index !== undefined && state.routes[state.index]?.state) {
    return getLeafState(state.routes[state.index].state);
  }
  return state;
}
