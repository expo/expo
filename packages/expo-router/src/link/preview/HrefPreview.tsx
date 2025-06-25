'use client';

import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useMemo } from 'react';

import { PreviewRouteContext } from './PreviewRouteContext';
import { RouteNode } from '../../Route';
import { INTERNAL_SLOT_NAME } from '../../constants';
import { store } from '../../global-state/router-store';
import { Href, UnknownOutputParams } from '../../types';
import { useNavigation } from '../../useNavigation';
import { getQualifiedRouteComponent } from '../../useScreens';
import { getPathFromState } from '../linking';

export function HrefPreview({ href }: { href: Href }) {
  const navigation = useNavigation();
  const { routeNode, params, state } = getParamsAndNodeFromHref(href);

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
  // It also check ensures TypeScript type safety.
  if (!routeNode) {
    return null;
  }

  const Component = getQualifiedRouteComponent(routeNode);

  return (
    <PreviewRouteContext value={value}>
      {/* Using NavigationContext to override useNavigation */}
      <NavigationContext value={navigationPropWithWarnings}>
        <Component navigation={navigation} />
      </NavigationContext>
    </PreviewRouteContext>
  );
}

function getParamsAndNodeFromHref(href: Href) {
  const hrefState = store.getStateForHref(href as any);
  if (hrefState?.routes[0] && hrefState.routes[0].name !== INTERNAL_SLOT_NAME) {
    const error = `Expo Router Error: Expected navigation state to begin with a ${INTERNAL_SLOT_NAME} route`;
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(error);
    } else {
      console.warn(error);
    }
  }
  // Assuming that root of the state is __root
  const initialState = hrefState?.routes[0]?.state;
  let state = initialState;
  let routeNode: RouteNode | undefined | null = store.routeNode;

  const params: UnknownOutputParams = {};

  while (state && routeNode) {
    const route = state.routes[state.index || state.routes.length - 1];
    Object.assign(params, route.params);
    state = route.state;
    routeNode = routeNode.children.find((child) => child.route === route.name);
  }

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
  navigateDeprecated: createNOOPWithWarning('navigateDeprecated'),
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
      type: 'stack',
      stale: false,
    };
  },
};
