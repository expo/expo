'use client';

import type { RouteNode } from '@expo/router-core';
import { getContextKey, sortRoutesWithInitial, sortRoutes } from '@expo/router-core';
import { createContext, use, type PropsWithChildren } from 'react';

const CurrentRouteContext = createContext<RouteNode | null>(null);
export const LocalRouteParamsContext = createContext<
  Record<string, string | undefined> | undefined
>({});

if (process.env.NODE_ENV !== 'production') {
  CurrentRouteContext.displayName = 'RouteNode';
}

/** Return the RouteNode at the current contextual boundary. */
export function useRouteNode(): RouteNode | null {
  return use(CurrentRouteContext);
}

export function useContextKey(): string {
  const node = useRouteNode();
  if (node == null) {
    throw new Error('No filename found. This is likely a bug in expo-router.');
  }
  return getContextKey(node.contextKey);
}

export type RouteProps = PropsWithChildren<{
  node: RouteNode;
  route?: { params: Record<string, string | undefined> };
}>;

/** Provides the matching routes and filename to the children. */
export function Route({ children, node, route }: RouteProps) {
  return (
    <LocalRouteParamsContext.Provider value={route?.params}>
      <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>
    </LocalRouteParamsContext.Provider>
  );
}

export { sortRoutesWithInitial, sortRoutes };
