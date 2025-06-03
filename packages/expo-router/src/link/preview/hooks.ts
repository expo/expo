import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import { use, useCallback, useMemo } from 'react';
import { RNSScreensRefContext } from 'react-native-screens/src/contexts';

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

  const getNativeTag = useCallback((): number | undefined => {
    const state = navigation.getState();

    if (state?.type !== 'stack') {
      console.warn('Peek and Pop only supports stack navigators');
      return;
    }

    const castedState = state as StackNavigationState<ParamListBase>;

    const routeKey = castedState.preloadedRoutes?.find(
      (r) => r.name === routeNode?.route && areParamsEqual(r.params, params)
    )?.key;

    return routeKey
      ? (screensRef?.current[routeKey].current as { __nativeTag: number } | undefined)?.__nativeTag
      : undefined;
  }, [params, routeNode]);
  const preload = useCallback(() => {
    router.prefetch(href);
  }, [href]);

  return {
    preload,
    getNativeTag,
  };
}
