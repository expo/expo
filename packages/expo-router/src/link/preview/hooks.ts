import {
  NavigationState,
  ParamListBase,
  PartialState,
  StackNavigationState,
} from '@react-navigation/native';
import { use, useCallback, useMemo } from 'react';
import { RNSScreensRefContext } from 'react-native-screens';

import { getParamsAndNodeFromHref } from './Preview';
import { useRouter } from '../../hooks';
import { Href } from '../../types';
import { useNavigation } from '../../useNavigation';

type Params = Readonly<object | undefined>;

function useScreensRef() {
  return use(RNSScreensRefContext);
}

const areParamsEqual = (a: Params, b: Params) => JSON.stringify(a) === JSON.stringify(b);

export function useScreenPreload(href: Href) {
  const navigation = useNavigation();
  const screensRef = useScreensRef();
  const router = useRouter();

  const { params, routeNode } = useMemo(() => getParamsAndNodeFromHref(href), [href]);

  const isValid = !!screensRef;

  const getNativeTag = useCallback((): number | undefined => {
    const state = getLeafState(navigation.getState());

    if (state?.type !== 'stack') {
      console.warn('Peek and Pop only supports stack navigators');
      return;
    }

    const castedState = state as StackNavigationState<ParamListBase>;

    const routeKey = castedState.preloadedRoutes?.find((r) => {
      // TODO: find out if this is correct solution. This is to cover cases of (.......)/index
      if (r.params && 'screen' in r.params) {
        return r.params.screen === routeNode?.route && areParamsEqual(r.params.params, params);
      }
      return r.name === routeNode?.route && areParamsEqual(r.params, params);
    })?.key;

    return routeKey
      ? (screensRef?.current[routeKey]?.current as { __nativeTag: number } | undefined)?.__nativeTag
      : undefined;
  }, [params, routeNode]);
  const preload = useCallback(() => {
    router.prefetch(href);
  }, [href]);

  return {
    preload,
    getNativeTag,
    isValid,
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
