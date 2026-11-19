'use client';

import { use, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Text, View } from 'react-native';

import type { RouteNode } from '../../Route';
import { INTERNAL_SLOT_NAME } from '../../constants';
import type { ResultState } from '../../exports';
import { CompositionContext } from '../../fork/native-stack/composition-options';
import { RouterConfigContext } from '../../global-state/routerConfigContext';
import { RouterRegistryContext, type RouterRegistry } from '../../global-state/routerRegistry';
import type { ReactNavigationState } from '../../global-state/types';
import { useRouteInfo } from '../../global-state/useRouteInfo';
import { getRootStackRouteNames } from '../../global-state/utils';
import { usePathname } from '../../hooks';
import { RootNavigationStateContext } from '../../react-navigation/core/RootNavigationStateContext';
import { useClientLayoutEffect } from '../../react-navigation/core/useClientLayoutEffect';
import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from '../../react-navigation/native';
import { findRouteNodeAndParamsForState } from '../../routeNode';
import type { Href, UnknownOutputParams } from '../../types';
import { useNavigation } from '../../useNavigation';
import { getQualifiedRouteComponent } from '../../useScreens';
import { getStateForHref } from '../getStateForHref';
import { getPathFromState } from '../linking';
import { PreviewRouteContext } from './PreviewRouteContext';

export function HrefPreview({ href }: { href: Href }) {
  // TODO(@ubax): Extract `linking` and `routeNode` into separate contexts to avoid unrelated rerenders.
  const { segments: routeSegments } = useRouteInfo();
  const { linking, routeNode } = use(RouterConfigContext) ?? {};
  const rootNavigationState = use(RootNavigationStateContext);
  const registry = use(RouterRegistryContext);
  const hrefState = useMemo(
    () => getStateForHref(href, { segments: routeSegments }, linking),
    [href, routeSegments, linking]
  );
  const index = hrefState?.index ?? 0;

  // Navigators register their guards in a layout effect. This waits for one, so a blocked screen never mounts.
  const [hasRegisteredGuards, setHasRegisteredGuards] = useState(false);
  useClientLayoutEffect(() => setHasRegisteredGuards(true), []);
  if (!hasRegisteredGuards) {
    return null;
  }

  if (
    hrefState?.routes[index]?.name === INTERNAL_SLOT_NAME &&
    !isProtected(hrefState, rootNavigationState, registry)
  ) {
    return <PreviewForRootHrefState hrefState={hrefState} href={href} rootRouteNode={routeNode} />;
  }

  const pathname = href.toString();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <PreviewRouteContext.Provider
      value={{
        params: {},
        pathname,
        segments,
      }}>
      <PreviewForInternalRoutes />
    </PreviewRouteContext.Provider>
  );
}

// A route that its mounted navigator blocks, or that is missing from its route names, is protected.
// One href can match several mounted instances of a route, so a block in any of them counts.
function isProtected(
  routerState: ResultState | undefined,
  rnState: ReactNavigationState | undefined,
  registry: RouterRegistry
): boolean {
  if (!routerState || !rnState) {
    return false;
  }
  const routerRoute: ResultState['routes'][number] = routerState.routes[0]!;
  if (
    rnState.stale === false &&
    (!rnState.routeNames?.includes(routerRoute.name) ||
      registry.get(rnState.key)?.getGuard?.(routerRoute.name))
  ) {
    return true;
  }
  const routes: { name: string; params?: object; state?: ReactNavigationState }[] =
    rnState.routes.filter((route: { name: string }) => route.name === routerRoute.name);
  const sameParamsRoutes = routes.filter((route) =>
    isEqual(route.params ?? {}, routerRoute.params ?? {})
  );
  return (sameParamsRoutes.length > 0 ? sameParamsRoutes : routes).some((route) =>
    isProtected(routerRoute.state, route.state, registry)
  );
}

function PreviewForRootHrefState({
  hrefState,
  href,
  rootRouteNode,
}: {
  hrefState: ResultState;
  href: Href;
  rootRouteNode: RouteNode | null | undefined;
}) {
  const navigation = useNavigation();
  const { routeNode, params, state } = getParamsAndNodeFromHref(hrefState, rootRouteNode);

  const path = state ? getPathFromState(state) : undefined;

  const value = useMemo(
    () => ({
      params,
      pathname: href.toString(),
      segments: path?.split('/').filter(Boolean) || [],
    }),
    [params, href]
  );

  // This can happen in a theoretical case where the state is not yet initialized or is incorrectly initialized.
  // This check ensures TypeScript type safety as well.
  if (!routeNode) {
    return null;
  }

  const Component = getQualifiedRouteComponent(routeNode);

  return (
    <PreviewRouteContext value={value}>
      <CompositionContext value={{ set: () => {}, unset: () => {} }}>
        {/* Using NavigationContext to override useNavigation */}
        <NavigationContext value={navigationPropWithWarnings}>
          {/* `getQualifiedRouteComponent` returns a cached component per route node,
              so the identity is stable across renders. */}
          {/* oxlint-disable-next-line react/static-components */}
          <Component navigation={navigation} />
        </NavigationContext>
      </CompositionContext>
    </PreviewRouteContext>
  );
}

function PreviewForInternalRoutes() {
  const pathname = usePathname();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'white',
      }}>
      <Text style={{ fontWeight: '600', fontSize: 24 }}>Invalid preview</Text>
      <Text style={{ fontWeight: '200', fontSize: 14 }}>{pathname}</Text>
    </View>
  );
}

function getParamsAndNodeFromHref(
  hrefState: ResultState,
  rootRouteNode: RouteNode | null | undefined
) {
  const index = hrefState?.index ?? 0;
  if (hrefState?.routes[index] && hrefState.routes[index].name !== INTERNAL_SLOT_NAME) {
    const error = `Expo Router Error: Expected navigation state to begin with one of [${getRootStackRouteNames().join(', ')}] routes`;
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(error);
    } else {
      console.warn(error);
    }
  }
  const initialState = hrefState?.routes[index]?.state;
  const { routeNode, params } = findRouteNodeAndParamsForState(rootRouteNode, initialState);

  // Linking has already parsed these values into the public search-param shape.
  return { params: params as UnknownOutputParams, routeNode, state: initialState };
}

const displayWarningForProp = (prop: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `navigation.${prop} should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'.`
    );
  }
};

const createNOOPWithWarning = (prop: string) => () => displayWarningForProp(prop);

const navigationPropWithWarnings: NavigationProp<ParamListBase> = {
  setParams: createNOOPWithWarning('setParams'),
  setOptions: createNOOPWithWarning('setOptions'),
  addListener: (() => () => {}) as NavigationProp<ParamListBase>['addListener'],
  removeListener: () => {},
  isFocused: () => true,
  canGoBack: () => false,
  dispatch: createNOOPWithWarning('dispatch'),
  navigate: createNOOPWithWarning('navigate'),
  goBack: createNOOPWithWarning('goBack'),
  reset: createNOOPWithWarning('reset'),
  push: createNOOPWithWarning('push'),
  pop: createNOOPWithWarning('pop'),
  popToTop: createNOOPWithWarning('popToTop'),
  preload: createNOOPWithWarning('preload'),
  getId: () => {
    displayWarningForProp('getId');
    return '';
  },
  // @ts-expect-error
  getParent: createNOOPWithWarning('getParent'),
  getState: () => {
    displayWarningForProp('getState');
    return {
      key: '',
      routeKeySeq: 0,
      index: 0,
      routeNames: [],
      routes: [],
      type: '',
      stale: false,
    };
  },
};
