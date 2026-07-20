'use client';
import * as React from 'react';

import { getPreloadAction } from '../global-state/getNavigationAction';
import type { NavigationAction, NavigationState } from './routers';

/**
 * After mount, preload the navigator's other routes per a caller-supplied policy. A route's
 * presence in `state.routes` is the loaded signal, so this dispatches a PRELOAD for every name in
 * `routeNamesToPreload` that isn't present yet (inserting it at the end of `routes` without changing
 * focus). The caller decides the policy — e.g. native/material-top preload all tabs, bottom-tabs and
 * drawer only their non-lazy ones.
 *
 * When `resolveHref` returns an href for a name, the PRELOAD is compiled via `getNavigateAction` so
 * it carries the route's full `payload.state` subtree — the child navigator commits already seeded
 * instead of mounting with a null slice. Without an href (a route absent from the compiled tree, or
 * a navigator rendered outside the router) it falls back to a bare-name PRELOAD.
 *
 * Self-healing: every run dispatches for every absent name — no pending marks. A dispatched preload
 * can be LOST without the routes identity ever changing (StrictMode's double-invoked mount effects
 * wipe and restore the child state) or by a competing commit landing over it (e.g.
 * `getStateForRouteNamesChange` repairing a seeded native-tabs level whose compiled `routeNames`
 * don't match the live trigger-only list). Any later effect run simply re-dispatches what's still
 * absent; the by-name idempotent reducer (absent → insert, present → refresh in place) converges
 * duplicates instead of duplicating routes, and a no-op dispatch doesn't re-trigger the effect, so
 * this can't loop.
 */
export function usePreloadRoutes(
  state: Pick<NavigationState, 'routes' | 'key'>,
  navigation: {
    preload: (name: string, params?: object) => void;
    dispatch: (action: NavigationAction) => void;
  },
  routeNamesToPreload: readonly string[],
  resolveHref?: (name: string) => string | undefined
): void {
  React.useEffect(() => {
    const present = new Set(state.routes.map((route) => route.name));

    for (const name of routeNamesToPreload) {
      if (present.has(name)) {
        continue;
      }

      const href = resolveHref?.(name);
      if (href == null) {
        navigation.preload(name);
        continue;
      }

      // A resolved href but no action means the compiler dropped it (e.g. a redirect already
      // handled the navigation) — skip rather than bare-preload a route with no valid target.
      const action = getPreloadAction(state.key, href, name, false);
      if (action != null) {
        navigation.dispatch(action);
      }
    }
    // Re-runs when the present routes, navigation, policy list, or href resolver change identity, so
    // re-preload-after-removal (hidden tab shown again) and re-preload-after-loss both fire.
  }, [state.routes, state.key, navigation, routeNamesToPreload, resolveHref]);
}
