'use client';

import { Href, UnknownOutputParams, useNavigation } from 'expo-router';
import { RouteNode } from 'expo-router/build/Route';
import { store } from 'expo-router/build/global-state/router-store';
import { getQualifiedRouteComponent } from 'expo-router/build/useScreens';
import { createContext } from 'react';

export const PreviewParamsContext = createContext<UnknownOutputParams | undefined>(undefined);

export function Preview({ href }: { href: Href }) {
  let state = store.getStateForHref(href).routes[0]?.state;
  let routeNode: RouteNode | undefined | null = store.routeNode;
  const navigation = useNavigation();

  const params = {};

  while (state && routeNode) {
    const route = state.routes[state.index || state.routes.length - 1];
    Object.assign(params, route.params);
    state = route.state;
    routeNode = routeNode.children.find((child) => child.route === route.name);
  }

  console.log('Preview', { href, params, routeNode });

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
