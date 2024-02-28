'use client';

import React, { ReactNode, useContext } from 'react';

import type { ErrorBoundaryProps } from './exports';
import { getContextKey } from './matchers';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';

export type DynamicConvention = { name: string; deep: boolean; notFound?: boolean };

export type LoadedRoute = {
  ErrorBoundary?: React.ComponentType<ErrorBoundaryProps>;
  default?: React.ComponentType<any>;
  unstable_settings?: Record<string, any>;
  getNavOptions?: (args: any) => any;
  generateStaticParams?: (props: {
    params?: Record<string, string | string[]>;
  }) => Record<string, string | string[]>[];
};

export type RouteNode = {
  /** The type of RouteNode */
  type: 'route' | 'api' | 'layout';
  /** Load a route into memory. Returns the exports from a route. */
  loadRoute: () => Partial<LoadedRoute>;
  /** Loaded initial route name. */
  initialRouteName?: string;
  /** nested routes */
  children: RouteNode[];
  /** Is the route a dynamic path */
  dynamic: null | DynamicConvention[];
  /** `index`, `error-boundary`, etc. */
  route: string;
  /** Context Module ID, used for matching children. */
  contextKey: string;
  /** Added in-memory */
  generated?: boolean;
  /** Internal screens like the directory or the auto 404 should be marked as internal. */
  internal?: boolean;
  /** File paths for async entry modules that should be included in the initial chunk request to ensure the runtime JavaScript matches the statically rendered HTML representation. */
  entryPoints?: string[];
};

const CurrentRouteContext = React.createContext<RouteNode | null>(null);

if (process.env.NODE_ENV !== 'production') {
  CurrentRouteContext.displayName = 'RouteNode';
}

/** Return the RouteNode at the current contextual boundary. */
export function useRouteNode(): RouteNode | null {
  return useContext(CurrentRouteContext);
}

export function useContextKey(): string {
  const node = useRouteNode();
  if (node == null) {
    throw new Error('No filename found. This is likely a bug in expo-router.');
  }
  return getContextKey(node.contextKey);
}

/** Provides the matching routes and filename to the children. */
export function Route({ children, node }: { children: ReactNode; node: RouteNode }) {
  return <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>;
}

export { sortRoutesWithInitial, sortRoutes };
