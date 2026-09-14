'use client';

import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server';
import { createContext, use, type ComponentType, type PropsWithChildren } from 'react';

import { getContextKey } from './matchers';
import type { PartialRoute, Route as NavigationRoute } from './react-navigation/routers';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';
import type { SuspenseFallbackProps } from './views/SuspenseFallback';
import type { ErrorBoundaryProps } from './views/Try';

export type DynamicConvention = { name: string; deep: boolean; notFound?: boolean };

type Params = Record<string, string | string[]>;

export type LoadedRoute = {
  ErrorBoundary?: ComponentType<ErrorBoundaryProps>;
  SuspenseFallback?: ComponentType<SuspenseFallbackProps>;
  default?: ComponentType<any>;
  unstable_settings?: Record<string, any>;
  getNavOptions?: (args: any) => any;
  generateStaticParams?: (props: { params?: Params }) => Params[];
  loader?: LoaderFunction;
  generateMetadata?: GenerateMetadataFunction;
};

export type LoadedMiddleware = Pick<LoadedRoute, 'default' | 'unstable_settings'>;

export type MiddlewareNode = {
  /** Context Module ID. Used to resolve the middleware module */
  contextKey: string;
  /** Loads middleware into memory. Returns the exports from +middleware.ts */
  loadRoute: () => Partial<LoadedMiddleware>;
};

/** Fields shared by every kind of route node. */
type RouteNodeBase = {
  /** Load a route into memory. Returns the exports from a route. */
  loadRoute: () => LoadedRoute;
  /** Is the route a dynamic path */
  dynamic: null | DynamicConvention[];
  /** `index`, `error-boundary`, etc. Relative to the nearest `_layout.tsx` */
  route: string;
  /** Context Module ID, used for matching children. */
  contextKey: string;
  /** Added in-memory */
  generated?: boolean;
};

/** A `_layout` file. The only node that holds children. */
export type LayoutRouteNode = RouteNodeBase & {
  type: 'layout';
  /** Nested routes */
  children: RouteNode[];
  /** Loaded initial route name. */
  initialRouteName?: string;
  /** Middleware function for server-side request processing. Only present on the root route node. */
  middleware?: MiddlewareNode;
};

/** A screen. */
export type ScreenRouteNode = RouteNodeBase & {
  type: 'route';
  /** Parent Context Module ID, used for matching static routes to their parent dynamic route. */
  parentContextKey?: string;
  /** Internal screens like the directory or the auto 404 should be marked as internal. */
  internal?: boolean;
  /** File paths for async entry modules that should be included in the initial chunk request to ensure the runtime JavaScript matches the statically rendered HTML representation. */
  entryPoints?: string[];
};

/** A `+api` file. Server only, so it carries none of the screen fields. */
export type ApiRouteNode = RouteNodeBase & {
  type: 'api';
};

/** A redirect declared in the config plugin options. */
export type RedirectRouteNode = RouteNodeBase & {
  type: 'redirect';
  /** Redirect Context Module ID, used for matching children. */
  destinationContextKey: string;
  /** Is the redirect permanent. */
  permanent: boolean;
  /** HTTP methods for this route. If undefined, assumed to be ['GET'] */
  methods?: string[];
  /** File paths for async entry modules that should be included in the initial chunk request to ensure the runtime JavaScript matches the statically rendered HTML representation. */
  entryPoints?: string[];
};

/** A rewrite declared in the config plugin options. Server only. */
export type RewriteRouteNode = RouteNodeBase & {
  type: 'rewrite';
  /** Rewrite Context Module ID, used for matching children. */
  destinationContextKey: string;
  /** HTTP methods for this route. If undefined, assumed to be ['GET'] */
  methods?: string[];
};

export type RouteNode =
  | LayoutRouteNode
  | ScreenRouteNode
  | ApiRouteNode
  | RedirectRouteNode
  | RewriteRouteNode;

/**
 * The children of `node`, or an empty list for nodes that cannot have any.
 * Returns the live array, so callers that sort it mutate the route tree.
 */
export function getChildren(node: RouteNode): RouteNode[] {
  return node.type === 'layout' ? node.children : [];
}

/** The entry points of `node`, or an empty list for nodes that cannot have any. */
export function getEntryPoints(node: RouteNode): string[] {
  return node.type === 'route' || node.type === 'redirect' ? (node.entryPoints ?? []) : [];
}

/** Whether `node` is a built-in screen such as the sitemap or the auto 404. */
export function isInternal(node: RouteNode): boolean {
  return node.type === 'route' && (node.internal ?? false);
}

/** The anchor of `node`, or `undefined` for nodes that cannot have one. */
export function getInitialRouteName(node: RouteNode | null | undefined): string | undefined {
  return node?.type === 'layout' ? node.initialRouteName : undefined;
}

const CurrentRouteContext = createContext<RouteNode | null>(null);
/** This context allows a `_layout.tsx` to provide a Suspense fallback for its child routes. */
export const SuspenseFallbackContext = createContext<
  ComponentType<SuspenseFallbackProps> | undefined
>(undefined);
/** This context carries the error boundary configured by the current layout or navigator. */
export const ScreenErrorBoundaryContext = createContext<
  ComponentType<ErrorBoundaryProps> | undefined
>(undefined);
export const LocalRouteParamsContext = createContext<object | undefined>({});

if (process.env.NODE_ENV !== 'production') {
  CurrentRouteContext.displayName = 'RouteNode';
}

/** Return the RouteNode at the current contextual boundary. */
export function useRouteNode(): RouteNode | null {
  return use(CurrentRouteContext);
}

export function findRouteNodeByName(
  node: RouteNode | null | undefined,
  name: string | undefined
): RouteNode | undefined {
  return node ? getChildren(node).find((child) => child.route === name) : undefined;
}

export function findRouteNodeAndParamsForState(
  node: RouteNode | null | undefined,
  state: PartialRoute<NavigationRoute<string>>['state']
): { routeNode: RouteNode | undefined; params: Record<string, unknown> } {
  const params: Record<string, unknown> = {};
  if (!state) {
    return { routeNode: undefined, params };
  }
  let routeNode = node ?? undefined;

  while (state) {
    const route: PartialRoute<NavigationRoute<string>> | undefined =
      state.routes[state.index ?? state.routes.length - 1];
    Object.assign(params, route?.params);
    routeNode = findRouteNodeByName(routeNode, route?.name);
    state = route?.state;
  }

  return { routeNode, params };
}

export function getValidInitialRoute(
  node: RouteNode | null,
  initialRouteName = getInitialRouteName(node),
  groupName?: string
): RouteNode | undefined {
  if (!node || !initialRouteName) {
    return undefined;
  }
  const route =
    findRouteNodeByName(node, initialRouteName) ||
    findRouteNodeByName(node, `${initialRouteName}/index`);
  if (!route) {
    throw new Error(
      `The initial route name "${initialRouteName}"${groupName ? ` for group "${groupName}"` : ''} was not found in the layout at "${node.contextKey}". ` +
        `Available routes are: ${getChildren(node)
          .map(({ route }) => `"${route}"`)
          .join(', ')}. ` +
        'Set `unstable_settings.anchor` to the name of a route in this layout.'
    );
  }
  return route;
}

export const getValidInitialRouteName = (
  node: RouteNode | null,
  initialRouteName = getInitialRouteName(node)
) => getValidInitialRoute(node, initialRouteName)?.route;

export function useContextKey(): string {
  const node = useRouteNode();
  if (node == null) {
    throw new Error('No filename found. This is likely a bug in expo-router.');
  }
  return getContextKey(node.contextKey);
}

export type RouteProps = PropsWithChildren<{
  node: RouteNode;
  params: object | undefined;
}>;

/** Provides the matching routes and filename to the children. */
export function Route({ children, node, params }: RouteProps) {
  return (
    <LocalRouteParamsContext.Provider value={params}>
      <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>
    </LocalRouteParamsContext.Provider>
  );
}

export { sortRoutesWithInitial, sortRoutes };
