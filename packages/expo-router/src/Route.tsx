'use client';

import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server';
import { createContext, use, type ComponentType, type PropsWithChildren } from 'react';

import { getContextKey } from './matchers';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';
import type { ContextKey, EntryPoint } from './types/paths';
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
  contextKey: ContextKey;
  /** Loads middleware into memory. Returns the exports from +middleware.ts */
  loadRoute: () => Partial<LoadedMiddleware>;
};

/** Fields shared by every kind of route node. */
export type RouteNodeBase = {
  /** Load a route into memory. Returns the exports from a route. */
  loadRoute: () => LoadedRoute;
  /** Is the route a dynamic path */
  dynamic: null | DynamicConvention[];
  /**
   * `index`, `error-boundary`, etc. Relative to the nearest `_layout.tsx`.
   *
   * Stays `string`: while the tree is being built this holds the path from the
   * tree root, and hoisting rewrites it to be layout-relative, so no single
   * type describes it.
   */
  route: string;
  /** Context Module ID, used for matching children. */
  contextKey: ContextKey;
  /** Added in-memory */
  generated?: boolean;
};

/** A `_layout` file. The only node that holds children. */
export type LayoutRouteNode = RouteNodeBase & {
  type: 'layout';
  /** Nested routes */
  children: RouteNode[];
  /** Last group in the layout path. Selects group-specific `unstable_settings` and the default anchor. */
  groupName?: string;
  /** Middleware function for server-side request processing. Only present on the root route node. */
  middleware?: MiddlewareNode;
};

/** A page. */
export type PageRouteNode = RouteNodeBase & {
  type: 'route';
  /** Parent Context Module ID, used for matching static routes to their parent dynamic route. */
  parentContextKey?: ContextKey;
  /** Internal screens like the directory or the auto 404 should be marked as internal. */
  internal?: boolean;
  /**
   * File paths for async entry modules that should be included in the initial chunk request to
   * ensure the runtime JavaScript matches the statically rendered HTML representation.
   *
   * Stays `string`: the router fills these with context keys (or a destination URL for an
   * external redirect), and static export later rewrites them to absolute module paths.
   */
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
  destinationContextKey: EntryPoint;
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
  | PageRouteNode
  | ApiRouteNode
  | RedirectRouteNode
  | RewriteRouteNode;

export const isLayoutRouteNode = (node: RouteNode | null | undefined): node is LayoutRouteNode =>
  node?.type === 'layout';

export const isPageRouteNode = (node: RouteNode | null | undefined): node is PageRouteNode =>
  node?.type === 'route';

export const isApiRouteNode = (node: RouteNode | null | undefined): node is ApiRouteNode =>
  node?.type === 'api';

export const isRedirectRouteNode = (
  node: RouteNode | null | undefined
): node is RedirectRouteNode => node?.type === 'redirect';

export const isRewriteRouteNode = (node: RouteNode | null | undefined): node is RewriteRouteNode =>
  node?.type === 'rewrite';

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
