'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { RouteNode } from '../Route';
import { LocalRouteParamsContext, sortRoutesWithInitial } from '../Route';
import { getContextKey } from '../matchers';
import type { Href } from '../types';

export type GuardedRedirects = Map<string, Href | undefined>;
// `Href` = guarded with a redirect, `null` = guarded with no available destination.
export type GuardRedirect = Href | null;
// Per route name; a missing entry means the route is unguarded.
export type ResolvedGuards = Map<string, GuardRedirect>;

export const GuardContext = createContext<ResolvedGuards | null>(null);
const GuardRedirectFallbackContext = createContext<GuardRedirectFallback[]>([]);

export function GuardContextProvider({
  node,
  guardedRedirects,
  children,
}: {
  node: RouteNode | null;
  guardedRedirects: GuardedRedirects;
  children: ReactNode;
}) {
  const parentFallbacks = use(GuardRedirectFallbackContext);
  const params = use(LocalRouteParamsContext);
  const guardConfigurationKey = serializeGuardedRedirects(guardedRedirects);
  const { fallbacks, resolvedGuards } = useMemo(
    () => computeGuardState(node, guardedRedirects, params, parentFallbacks),
    [
      node,
      node?.children,
      node?.contextKey,
      node?.initialRouteName,
      params,
      parentFallbacks,
      guardConfigurationKey,
    ]
  );

  return (
    <GuardRedirectFallbackContext value={fallbacks}>
      <GuardContext value={resolvedGuards}>{children}</GuardContext>
    </GuardRedirectFallbackContext>
  );
}

function computeGuardState(
  node: RouteNode | null,
  guardedRedirects: GuardedRedirects,
  params: object | undefined,
  parentFallbacks: GuardRedirectFallback[]
) {
  const navigatorFallback = getNavigatorFallback(node, guardedRedirects, params);
  const inheritedFallbacks = removeFallbacksTargetingNavigator(parentFallbacks, node);
  const fallbacks = navigatorFallback
    ? [navigatorFallback, ...inheritedFallbacks]
    : inheritedFallbacks;

  return {
    fallbacks,
    resolvedGuards: resolveGuardRedirects(guardedRedirects, fallbacks[0]?.href),
  };
}

export function useGuardRedirect(routeName: string): GuardRedirect | undefined {
  const guards = use(GuardContext);
  if (!guards) {
    return undefined;
  }

  if (guards.has(routeName)) {
    return guards.get(routeName) ?? null;
  }

  const normalizedRouteName = normalizeRouteName(routeName);
  return guards.has(normalizedRouteName) ? (guards.get(normalizedRouteName) ?? null) : undefined;
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
  node: Pick<RouteNode, 'children' | 'initialRouteName'>,
  guardedRedirects: GuardedRedirects
): RouteNode | undefined {
  const children = [...node.children].sort(sortRoutesWithInitial(node.initialRouteName));
  const anchor = node.initialRouteName
    ? children.find(
        (child) =>
          child.route === node.initialRouteName ||
          normalizeRouteName(child.route) === node.initialRouteName
      )
    : undefined;

  if (anchor && !isRouteGuarded(anchor.route, guardedRedirects)) {
    return anchor;
  }

  return children.find((child) => !isRouteGuarded(child.route, guardedRedirects));
}

export function isRouteGuarded(routeName: string, guards: ReadonlyMap<string, unknown>): boolean {
  return guards.has(routeName) || guards.has(normalizeRouteName(routeName));
}

function resolveGuardRedirects(
  guardedRedirects: GuardedRedirects,
  fallbackHref: Href | undefined
): ResolvedGuards {
  return new Map<string, GuardRedirect>(
    Array.from(
      guardedRedirects,
      ([name, redirectTo]) => [name, redirectTo ?? fallbackHref ?? null] as const
    )
  );
}

function serializeGuardedRedirects(guardedRedirects: GuardedRedirects): string {
  return JSON.stringify(Array.from(guardedRedirects.entries()));
}
