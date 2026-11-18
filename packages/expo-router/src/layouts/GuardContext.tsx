'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { RouteNode } from '../Route';
import { LocalRouteParamsContext, sortRoutesWithInitial } from '../Route';
import { getContextKey } from '../matchers';
import { getValidInitialRoute } from '../routeNode';
import type { Href } from '../types';

// Per route name, the explicit redirect of its outermost failed guard. A missing entry means the
// route is accessible; an `undefined` value means the failed guard has no redirect.
export type GuardedRedirects = Map<string, Href | undefined>;
// `Href` = guarded with a redirect, `null` = guarded with no available destination.
export type GuardRedirect = Href | null;
export type FailedGuard = { name: string; redirectTo?: Href };

type GuardContextValue = {
  // The layout that declared `guards`. A navigator builder applies only its own layout's guards.
  node: RouteNode | null;
  guards: GuardedRedirects;
  fallbacks: GuardRedirectFallback[];
};

export const GuardContext = createContext<GuardContextValue | null>(null);
const noFallbacks: GuardRedirectFallback[] = [];

export function GuardContextProvider({
  node,
  guardedRedirects,
  children,
}: {
  node: RouteNode | null;
  guardedRedirects: GuardedRedirects;
  children: ReactNode;
}) {
  const parentFallbacks = use(GuardContext)?.fallbacks ?? noFallbacks;
  const params = use(LocalRouteParamsContext);
  const guardConfigurationKey = serializeGuardedRedirects(guardedRedirects);
  const value = useMemo(
    () => computeGuardState(node, guardedRedirects, params, parentFallbacks),
    [node, node?.children, node?.contextKey, params, parentFallbacks, guardConfigurationKey]
  );

  return <GuardContext value={value}>{children}</GuardContext>;
}

function computeGuardState(
  node: RouteNode | null,
  guardedRedirects: GuardedRedirects,
  params: object | undefined,
  parentFallbacks: GuardRedirectFallback[]
): GuardContextValue {
  const navigatorFallback = getNavigatorFallback(node, guardedRedirects, params);
  const inheritedFallbacks = removeFallbacksTargetingNavigator(parentFallbacks, node);
  const fallbacks = navigatorFallback
    ? [navigatorFallback, ...inheritedFallbacks]
    : inheritedFallbacks;

  return { node, guards: guardedRedirects, fallbacks };
}

export function useGuardRedirect(routeName: string): GuardRedirect | undefined {
  const owner = use(GuardContext);
  const guard = getFailedGuard(owner?.guards, routeName);
  return guard ? (guard.redirectTo ?? owner?.fallbacks[0]?.href ?? null) : undefined;
}

/** Returns the failed guards declared by `node`, ignoring guards of an enclosing layout. */
export function useLayoutGuards(node: RouteNode | null): GuardedRedirects | undefined {
  const owner = use(GuardContext);
  return owner?.node === node ? owner.guards : undefined;
}

export function getFailedGuard(
  guards: GuardedRedirects | undefined,
  routeName: string
): FailedGuard | undefined {
  const name = guards?.has(routeName) ? routeName : normalizeRouteName(routeName);
  return guards?.has(name) ? { name, redirectTo: guards.get(name) } : undefined;
}

export function normalizeRouteName(routeName: string): string {
  return routeName.replace(/\/index$/, '');
}

type GuardRedirectFallback = {
  href: Href;
  targetRouteContextKey: string | null;
};

function getNavigatorFallback(
  node: RouteNode | null,
  guardedRedirects: GuardedRedirects,
  params: object | undefined
): GuardRedirectFallback | undefined {
  if (!node) {
    return { href: '/' as Href, targetRouteContextKey: null };
  }

  const route = findDefaultRedirectRouteInNavigator(node, guardedRedirects);
  if (!route) {
    return undefined;
  }

  const pathname = normalizeRouteName(getContextKey(route.contextKey)) || '/';
  return {
    href: Object.keys(params ?? {}).length ? ({ pathname, params } as Href) : (pathname as Href),
    targetRouteContextKey: route.contextKey,
  };
}

function removeFallbacksTargetingNavigator(
  fallbacks: GuardRedirectFallback[],
  node: RouteNode | null
): GuardRedirectFallback[] {
  // Route identity is required because pathless groups can share the same visible URL.
  return fallbacks.filter((fallback) => fallback.targetRouteContextKey !== node?.contextKey);
}

function findDefaultRedirectRouteInNavigator(
  node: RouteNode,
  guardedRedirects: GuardedRedirects
): RouteNode | undefined {
  const anchor = getValidInitialRoute(node);
  const children = [...node.children].sort(sortRoutesWithInitial(anchor?.route));

  if (anchor && !isRouteGuarded(anchor.route, guardedRedirects)) {
    return anchor;
  }

  // A redirect route has no screen to show, so it cannot be the fallback.
  return children.find(
    (child) => child.type !== 'redirect' && !isRouteGuarded(child.route, guardedRedirects)
  );
}

export function isRouteGuarded(routeName: string, guards: ReadonlyMap<string, unknown>): boolean {
  return guards.has(routeName) || guards.has(normalizeRouteName(routeName));
}

function serializeGuardedRedirects(guardedRedirects: GuardedRedirects): string {
  return JSON.stringify(Array.from(guardedRedirects.entries()));
}
