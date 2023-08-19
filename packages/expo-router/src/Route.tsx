import React, { ReactNode, useContext } from 'react';

import type { ErrorBoundaryProps } from './exports';
import { getContextKey, matchGroupName } from './matchers';

export type DynamicConvention = { name: string; deep: boolean };

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

export function sortRoutesWithInitial(initialRouteName?: string) {
  return (a: RouteNode, b: RouteNode): number => {
    if (initialRouteName) {
      if (a.route === initialRouteName) {
        return -1;
      }
      if (b.route === initialRouteName) {
        return 1;
      }
    }
    return sortRoutes(a, b);
  };
}

export function sortRoutes(a: RouteNode, b: RouteNode): number {
  if (a.dynamic && !b.dynamic) {
    return 1;
  }
  if (!a.dynamic && b.dynamic) {
    return -1;
  }
  if (a.dynamic && b.dynamic) {
    if (a.dynamic.length !== b.dynamic.length) {
      return b.dynamic.length - a.dynamic.length;
    }
    for (let i = 0; i < a.dynamic.length; i++) {
      const aDynamic = a.dynamic[i];
      const bDynamic = b.dynamic[i];
      if (aDynamic.deep && !bDynamic.deep) {
        return 1;
      }
      if (!aDynamic.deep && bDynamic.deep) {
        return -1;
      }
    }
    return 0;
  }

  const aIndex = a.route === 'index' || matchGroupName(a.route) != null;
  const bIndex = b.route === 'index' || matchGroupName(b.route) != null;

  if (aIndex && !bIndex) {
    return -1;
  }
  if (!aIndex && bIndex) {
    return 1;
  }

  return a.route.length - b.route.length;
}
