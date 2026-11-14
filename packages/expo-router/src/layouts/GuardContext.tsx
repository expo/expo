'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { RouteNode } from '../Route';
import { LocalRouteParamsContext, sortRoutesWithInitial } from '../Route';
import { getContextKey } from '../matchers';
import { type NavigationProp, type ParamListBase, StackActions } from '../react-navigation/native';
import { getValidInitialRoute } from '../routeNode';
import type { Href } from '../types';

export type GuardedRedirects = Map<string, Href | undefined>;
// The route that replaces a guarded route without `redirectTo`.
export type GuardFallback = {
  name: string;
  params: object | undefined;
  // Id of the navigator that owns the route.
  navigatorId: string;
  targetRouteContextKey: string;
};
// Neither field means guarded with no available destination.
export type ResolvedGuard = { redirectTo?: Href; fallback?: GuardFallback };
// Per route name; a missing entry means the route is unguarded.
export type ResolvedGuards = Map<string, ResolvedGuard>;

export const GuardContext = createContext<ResolvedGuards | null>(null);
const GuardFallbackContext = createContext<GuardFallback[]>([]);

export function GuardContextProvider({
  node,
  guardedRedirects,
  children,
}: {
  node: RouteNode | null;
  guardedRedirects: GuardedRedirects;
  children: ReactNode;
}) {
  const parentFallbacks = use(GuardFallbackContext);
  const params = use(LocalRouteParamsContext);
  const guardConfigurationKey = serializeGuardedRedirects(guardedRedirects);
  const { fallbacks, resolvedGuards } = useMemo(
    () => computeGuardState(node, guardedRedirects, params, parentFallbacks),
    [node, node?.children, node?.contextKey, params, parentFallbacks, guardConfigurationKey]
  );

  return (
    <GuardFallbackContext value={fallbacks}>
      <GuardContext value={resolvedGuards}>{children}</GuardContext>
    </GuardFallbackContext>
  );
}

function computeGuardState(
  node: RouteNode | null,
  guardedRedirects: GuardedRedirects,
  params: object | undefined,
  parentFallbacks: GuardFallback[]
) {
  if (!node) {
    throw new Error(
      'Expo Router could not find the route of this navigator, so it cannot choose a fallback for protected routes. ' +
        'Render the navigator in a `_layout` file. If it is already in a `_layout` file, report this as a bug in Expo Router.'
    );
  }

  const navigatorFallback = getNavigatorFallback(node, guardedRedirects, params);
  const inheritedFallbacks = removeFallbacksTargetingNavigator(parentFallbacks, node);
  const fallbacks = navigatorFallback
    ? [navigatorFallback, ...inheritedFallbacks]
    : inheritedFallbacks;

  return {
    fallbacks,
    resolvedGuards: resolveGuardRedirects(guardedRedirects, fallbacks[0]),
  };
}

export function useResolvedGuard(routeName: string): ResolvedGuard | undefined {
  const guards = use(GuardContext);
  if (!guards) {
    return undefined;
  }

  if (guards.has(routeName)) {
    return guards.get(routeName);
  }

  const normalizedRouteName = normalizeRouteName(routeName);
  return guards.get(normalizedRouteName);
}

// Replaces by route name, not by URL, because a guarded group can share its URL with the fallback.
export function dispatchReplaceWithGuardFallback(
  navigation: Pick<NavigationProp<ParamListBase>, 'getParent'>,
  fallback: GuardFallback
) {
  const owner = navigation.getParent(fallback.navigatorId);
  if (!owner) {
    if (__DEV__) {
      console.warn(
        `Expo Router could not open the fallback route "${fallback.name}" of a protected route in "${fallback.navigatorId}", because every visible tab is protected and "${fallback.name}" has no visible tab. ` +
          `Add a visible screen for "${fallback.name}", or set \`redirectTo\` on the \`Protected\` component.`
      );
    }
    return;
  }
  // Stack, tab, and drawer routers handle `REPLACE`. The target stops other navigators from handling it.
  owner.dispatch({
    ...StackActions.replace(fallback.name, fallback.params),
    target: owner.getState().key,
  });
}

export function normalizeRouteName(routeName: string): string {
  return routeName.replace(/\/index$/, '');
}

function getNavigatorFallback(
  node: RouteNode,
  guardedRedirects: GuardedRedirects,
  params: object | undefined
): GuardFallback | undefined {
  const route = findDefaultRedirectRouteInNavigator(node, guardedRedirects);
  if (!route) {
    return undefined;
  }

  return {
    name: route.route,
    params: Object.keys(params ?? {}).length ? params : undefined,
    navigatorId: getContextKey(node.contextKey),
    targetRouteContextKey: route.contextKey,
  };
}

function removeFallbacksTargetingNavigator(
  fallbacks: GuardFallback[],
  node: RouteNode
): GuardFallback[] {
  // Route identity is required because pathless groups can share the same visible URL.
  return fallbacks.filter((fallback) => fallback.targetRouteContextKey !== node.contextKey);
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

  return children.find((child) => !isRouteGuarded(child.route, guardedRedirects));
}

export function isRouteGuarded(routeName: string, guards: ReadonlyMap<string, unknown>): boolean {
  return guards.has(routeName) || guards.has(normalizeRouteName(routeName));
}

function resolveGuardRedirects(
  guardedRedirects: GuardedRedirects,
  fallback: GuardFallback | undefined
): ResolvedGuards {
  return new Map(
    Array.from(
      guardedRedirects,
      ([name, redirectTo]) =>
        [name, redirectTo !== undefined ? { redirectTo } : { fallback }] as const
    )
  );
}

function serializeGuardedRedirects(guardedRedirects: GuardedRedirects): string {
  return JSON.stringify(Array.from(guardedRedirects.entries()));
}
