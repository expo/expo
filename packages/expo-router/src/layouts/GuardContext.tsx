'use client';

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { RouteNode } from '../Route';
import { LocalRouteParamsContext, sortRoutesWithInitial } from '../Route';
import { PendingIntentsContext } from '../global-state/routingQueueContext';
import { getContextKey } from '../matchers';
import { getValidInitialRoute } from '../routeNode';
import type { Href } from '../types';
import { useFocusedGuardRedirect } from './useFocusedGuardRedirect';

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
  // The accessible route that this layout's navigator opens when no visit survives.
  fallbackName?: string;
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

  return { node, guards: guardedRedirects, fallbacks, fallbackName: navigatorFallback?.name };
}

export function useGuardRedirect(routeName: string): GuardRedirect | undefined {
  const owner = use(GuardContext);
  const guard = getFailedGuard(owner?.guards, routeName);
  return guard ? (guard.redirectTo ?? owner?.fallbacks[0]?.href ?? null) : undefined;
}

/**
 * Returns the failed guards declared by `node`, ignoring guards of an enclosing layout, and the
 * declared route names that the navigator may show.
 */
export function useLayoutGuards(
  node: RouteNode | null,
  declaredNames: string[],
  navigatorKey: string,
  focusedName: string | undefined
) {
  const owner = use(GuardContext);
  const guards = owner?.node === node ? owner.guards : undefined;
  const eligible = guards?.size
    ? declaredNames.filter((name) => !isRouteGuarded(name, guards))
    : declaredNames;
  const focusedGuard = focusedName === undefined ? undefined : getFailedGuard(guards, focusedName);
  // App navigation queued before the guard failed, for example in the handler that changed the
  // guard, acts on the blocked screen. Record that boundary once per guard change, because the
  // queue also receives later actions before the root catches up. `use` is read only while the
  // focused route is blocked, so other navigators do not re-render when the queue changes.
  const guardChange = focusedGuard
    ? [navigatorKey, focusedName, ...eligible].join('\0')
    : undefined;
  const [boundary, setBoundary] = useState<{ guardChange?: string; actionId?: number }>({});
  let queuedBeforeGuard = boundary.actionId;
  if (boundary.guardChange !== guardChange) {
    queuedBeforeGuard = focusedGuard
      ? use(PendingIntentsContext).reduce<number | undefined>(
          (last, intent) =>
            intent.type === 'COMPUTED_ACTION' ? last : Math.max(last ?? 0, intent.actionId),
          undefined
        )
      : undefined;
    setBoundary({ guardChange, actionId: queuedBeforeGuard });
  }
  const redirect = useFocusedGuardRedirect(
    queuedBeforeGuard === undefined ? focusedGuard?.redirectTo : undefined,
    navigatorKey,
    eligible
  );
  // With no accessible route left, the nearest ancestor opens its fallback by route identity.
  const ancestorFallback =
    focusedGuard && eligible.length === 0 ? owner?.fallbacks.find((f) => f.name) : undefined;
  // No warning when the root opens an explicit redirect or an ancestor fallback instead.
  const allBlocked =
    eligible.length === 0 && !ancestorFallback && focusedGuard?.redirectTo === undefined;
  useEffect(() => {
    if (__DEV__ && allBlocked) {
      console.warn(
        'All routes in this navigator are protected. Ensure at least one route is accessible.'
      );
    }
  }, [allBlocked]);
  return {
    routeNames: eligible,
    guards,
    fallbackName: guards && owner?.fallbackName,
    focusedGuard,
    redirect,
    ancestorFallback,
    queuedBeforeGuard,
  };
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

export type GuardRedirectFallback = {
  // The route of `ownerNode`'s navigator to open, by identity.
  name?: string;
  params?: object;
  ownerNode?: RouteNode;
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
    name: route.route,
    params,
    ownerNode: node,
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
