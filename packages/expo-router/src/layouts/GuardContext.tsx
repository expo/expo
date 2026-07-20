'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { RouteNode } from '../Route';
import { resolveHref } from '../link/href';
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

/** Default redirect target: the navigator's anchor (`initialRouteName`) resolved to an href. */
function resolveAnchorHref(node: RouteNode): Href {
  const anchor = node.initialRouteName;
  if (!anchor) {
    return '/';
  }
  const child = node.children.find((c) => c.route === anchor || c.route === `${anchor}/index`);
  if (!child) {
    return '/';
  }
  return (stripInvisibleSegmentsFromPath(getContextKey(child.contextKey)) || '/') as Href;
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
  const anchorHref = node ? resolveAnchorHref(node) : '/';

  // A stable signature of the guarded set + targets. `guardedRedirects` is a fresh Map on every
  // render (its children are rebuilt each render), so we key the memo by content instead of identity.
  // The resolved anchor is included because entries without an explicit `redirectTo` fall back to it.
  const signature = useMemo(
    () =>
      resolveHref(anchorHref) +
      '::' +
      Array.from(guardedRedirects.entries())
        .map(([name, href]) => `${name}=${href == null ? '' : resolveHref(href)}`)
        .join('|'),
    [guardedRedirects, anchorHref]
  );

  const resolved = useMemo(() => {
    const map = new Map<string, Href>();
    guardedRedirects.forEach((redirectTo, name) => {
      // TODO: Prevent infinite redirect loops when the resolved target is itself a guarded route —
      // a self-referential `redirectTo`/anchor (target resolves to this route's own path) or a
      // multi-route cycle (A→B→A). Today such a misconfiguration redirects forever.
      map.set(name, redirectTo ?? anchorHref);
    });
    return map;
    // `signature` captures the content of `guardedRedirects` and the resolved anchor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return <GuardContext value={resolved}>{children}</GuardContext>;
}
