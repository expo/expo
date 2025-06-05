'use client';

import { createContext } from 'react';

import { RouteNode } from '../../Route';
import { store } from '../../global-state/router-store';
import { Href, UnknownOutputParams } from '../../types';
import { useNavigation } from '../../useNavigation';
import { getQualifiedRouteComponent } from '../../useScreens';
import { resolveHref, resolveHrefStringWithSegments } from '../href';

export const PreviewParamsContext = createContext<UnknownOutputParams | undefined>(undefined);

// TODO: Handle usePathname/useSegments properly
// TODO: Maybe pass isPreview prop to a screen

export function Preview({ href }: { href: Href }) {
  const navigation = useNavigation();
  const { routeNode, params } = getParamsAndNodeFromHref(href);

  if (!routeNode) {
    return null;
  }

  const Component = getQualifiedRouteComponent(routeNode);

  return (
    <PreviewParamsContext.Provider value={params}>
      <Component navigation={navigation} />
    </PreviewParamsContext.Provider>
  );
}

export function getParamsAndNodeFromHref(href: Href) {
  let state = getStateForHref(href as any)?.routes[0]?.state;
  let routeNode: RouteNode | undefined | null = store.routeNode;

  const params: UnknownOutputParams = {};

  while (state && routeNode) {
    const route = state.routes[state.index || state.routes.length - 1];
    Object.assign(params, route.params);
    state = route.state;
    routeNode = routeNode.children.find((child) => child.route === route.name);
  }

  return { params, routeNode };
}

function getStateForHref(href: string, options = {}) {
  href = resolveHref(href as any);

  href = resolveHrefStringWithSegments(href, store.getRouteInfo(), options);
  return store.linking?.getStateFromPath!(href, store.linking.config);
}
