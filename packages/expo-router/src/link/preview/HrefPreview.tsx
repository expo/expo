'use client';

import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { findRouteNodeForState, type RouteNode } from '../../Route';
import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../../constants';
import type { ResultState } from '../../exports';
import { CompositionContext } from '../../fork/native-stack/composition-options';
import { store } from '../../global-state/router-store';
import { useRouteInfo } from '../../global-state/useRouteInfo';
import { getRootStackRouteNames } from '../../global-state/utils';
import { usePathname } from '../../hooks';
import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from '../../react-navigation/native';
import type { Href, UnknownOutputParams } from '../../types';
import { useNavigation } from '../../useNavigation';
import { getQualifiedRouteComponent } from '../../useScreens';
import { getStateForHref } from '../getStateForHref';
import { getPathFromState } from '../linking';
import { PreviewRouteContext } from './PreviewRouteContext';

export function HrefPreview({ href }: { href: Href }) {
  // TODO(@ubax): Check if using more granular context would improve performance here.
  const { segments: routeSegments } = useRouteInfo();
  const hrefState = useMemo(
    () => getStateForHref(href, { segments: routeSegments }),
    [href, routeSegments]
  );
  const index = hrefState?.index ?? 0;

  let isProtected = false;
  if (hrefState?.routes[index]?.name === INTERNAL_SLOT_NAME) {
    let routerState: typeof hrefState | undefined = hrefState;
    let rnState = store.state;
    while (routerState && rnState) {
      const routerRoute: ResultState['routes'][number] = routerState.routes[0]!;
      // When the route we want to show is not present in react-navigation state
      // Then most likely it is a protected route
      if (rnState.stale === false && !rnState.routeNames?.includes(routerRoute.name)) {
        isProtected = true;
        break;
      }
      const rnIndex = rnState.routes.findIndex((route) => route.name === routerRoute.name);
      if (rnIndex === -1) {
        break;
      }
      routerState = routerRoute.state;
      rnState = rnState.routes[rnIndex]?.state;
    }
    if (!isProtected) {
      return <PreviewForRootHrefState hrefState={hrefState} href={href} />;
    }
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

function PreviewForRootHrefState({ hrefState, href }: { hrefState: ResultState; href: Href }) {
  const navigation = useNavigation();
  const { routeNode, params, state } = getParamsAndNodeFromHref(hrefState);

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

function collectParamsFromState(state: ResultState | undefined): UnknownOutputParams {
  const params: UnknownOutputParams = {};

  while (state) {
    const route = state.routes[state.index ?? state.routes.length - 1]!;
    Object.assign(params, route.params);
    state = route.state;
  }

  return params;
}

function getParamsAndNodeFromHref(hrefState: ResultState) {
  const index = hrefState?.index ?? 0;
  if (hrefState?.routes[index] && hrefState.routes[index].name !== INTERNAL_SLOT_NAME) {
    const name = hrefState.routes[index].name;
    if (name === SITEMAP_ROUTE_NAME || name === NOT_FOUND_ROUTE_NAME) {
      console.log(store.routeNode);
      console.log(hrefState);
    }
    const error = `Expo Router Error: Expected navigation state to begin with one of [${getRootStackRouteNames().join(', ')}] routes`;
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(error);
    } else {
      console.warn(error);
    }
  }
  const initialState = hrefState?.routes[index]?.state;
  const initialRoute = initialState?.routes[initialState.index ?? initialState.routes.length - 1];
  const routeNode: RouteNode | undefined = findRouteNodeForState(store.routeNode, initialRoute);
  const params = collectParamsFromState(initialState);

  return { params, routeNode, state: initialState };
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
      index: 0,
      routeNames: [],
      routes: [],
      type: '',
      stale: false,
    };
  },
};
