'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { RouteNode } from '../Route';
import { sortRoutesWithInitial } from '../Route';
import { getContextKey, stripInvisibleSegmentsFromPath } from '../matchers';
import type { Href } from '../types';

export const GuardContext = createContext<Map<string, Href> | null>(null);

export function useGuardRedirect(routeName: string): Href | undefined {
  const guards = use(GuardContext);
  if (!guards) {
    return undefined;
  }
  return guards.get(routeName) ?? guards.get(routeName.replace(/\/index$/, ''));
}

function matchesRouteName(route: string, name: string) {
  return route === name || route === `${name}/index` || route.replace(/\/index$/, '') === name;
}

function routeNodeToHref(route: RouteNode): Href {
  return (stripInvisibleSegmentsFromPath(getContextKey(route.contextKey)) || '/') as Href;
}

function resolveDefaultHref(node: RouteNode, guardedRedirects: Map<string, Href | undefined>) {
  const children = [...node.children].sort(sortRoutesWithInitial(node.initialRouteName));
  const anchor = node.initialRouteName
    ? children.find((child) => matchesRouteName(child.route, node.initialRouteName!))
    : null;

  if (
    anchor &&
    !guardedRedirects.has(anchor.route) &&
    !guardedRedirects.has(anchor.route.replace(/\/index$/, ''))
  ) {
    return routeNodeToHref(anchor);
  }

  const firstAvailable = children.find(
    (child) =>
      !guardedRedirects.has(child.route) &&
      !guardedRedirects.has(child.route.replace(/\/index$/, ''))
  );

  return firstAvailable ? routeNodeToHref(firstAvailable) : undefined;
}

export function GuardContextProvider({
  node,
  guardedRedirects,
  children,
}: {
  node: RouteNode | null;
  guardedRedirects: Map<string, Href | undefined>;
  children: ReactNode;
}) {
  const signature = useMemo(
    () =>
      `${node?.contextKey ?? ''}:${node?.initialRouteName ?? ''}:` +
      Array.from(guardedRedirects.entries())
        .map(([name, href]) => `${name}=${href ?? ''}`)
        .join('|'),
    [guardedRedirects, node?.contextKey, node?.initialRouteName]
  );

  const resolved = useMemo(() => {
    const map = new Map<string, Href>();
    const defaultHref = node ? resolveDefaultHref(node, guardedRedirects) : '/';

    guardedRedirects.forEach((redirectTo, name) => {
      const href = redirectTo ?? defaultHref;
      if (href != null) {
        map.set(name, href);
      }
    });

    return map;
    // `signature` captures the guarded map content and navigator identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return <GuardContext value={resolved}>{children}</GuardContext>;
}
