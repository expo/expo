'use client';
import * as React from 'react';

import type { NavigationState } from './routers';

/**
 * After mount, preload the navigator's other routes per a caller-supplied policy. A route's
 * presence in `state.routes` is the loaded signal, so this dispatches `preload` for every name in
 * `routeNamesToPreload` that isn't present yet (inserting it at the end of `routes` without changing
 * focus). The caller decides the policy — e.g. native/material-top preload all tabs, bottom-tabs and
 * drawer only their non-lazy ones.
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
  state: Pick<NavigationState, 'routes'>,
  navigation: { preload: (name: string, params?: object) => void },
  routeNamesToPreload: readonly string[]
): void {
  React.useEffect(() => {
    const present = new Set(state.routes.map((route) => route.name));

    for (const name of routeNamesToPreload) {
      if (!present.has(name)) {
        navigation.preload(name);
      }
    }
    // Re-runs when the present routes, navigation, or policy list change identity, so
    // re-preload-after-removal (hidden tab shown again) and re-preload-after-loss both fire.
  }, [state.routes, navigation, routeNamesToPreload]);
}
