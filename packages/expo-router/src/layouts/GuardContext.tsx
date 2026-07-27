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

function routeNodeToHref(route: Pick<RouteNode, 'contextKey'>): Href {
  return (stripInvisibleSegmentsFromPath(getContextKey(route.contextKey)) || '/') as Href;
}

function serializeGuardedRedirects(guardedRedirects: Map<string, Href | undefined>): string {
  return Array.from(guardedRedirects.entries())
    .map(([name, href]) => `${name}=${href ?? ''}`)
    .join('|');
}

function resolveDefaultHref(
  node: Pick<RouteNode, 'children' | 'initialRouteName'>,
  guardedRedirects: Map<string, Href | undefined>
) {
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
  const signature = useMemo(() => serializeGuardedRedirects(guardedRedirects), [guardedRedirects]);

  const resolved = useMemo(() => {
    const defaultHref = node
      ? resolveDefaultHref(
          { children: node.children, initialRouteName: node.initialRouteName },
          guardedRedirects
        )
      : '/';

    return new Map<string, Href>(
      Array.from(
        guardedRedirects,
        ([name, redirectTo]) => [name, redirectTo ?? defaultHref] as const
      ).filter((entry): entry is [string, Href] => entry[1] != null)
    );
  }, [signature, node?.children, node?.initialRouteName]);

  return <GuardContext value={resolved}>{children}</GuardContext>;
}
