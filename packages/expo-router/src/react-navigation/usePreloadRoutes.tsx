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
 * Dedup uses a pending set that CLEARS once a name shows up in `state.routes`, not a lifetime mark.
 * A lifetime mark would never re-preload a tab that was shown, then removed (e.g. a hidden tab), and
 * then requested again. Clearing on presence means a later removal makes the name eligible again.
 */
export function usePreloadRoutes(
  state: Pick<NavigationState, 'routes'>,
  navigation: { preload: (name: string, params?: object) => void },
  routeNamesToPreload: readonly string[]
): void {
  // Names we've dispatched a preload for and are still waiting to see land in `state.routes`.
  const pending = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const present = new Set(state.routes.map((route) => route.name));

    // A dispatched preload has landed (or the route was added some other way): stop tracking it so a
    // future removal can re-preload.
    for (const name of pending.current) {
      if (present.has(name)) {
        pending.current.delete(name);
      }
    }

    for (const name of routeNamesToPreload) {
      if (present.has(name) || pending.current.has(name)) {
        continue;
      }
      pending.current.add(name);
      navigation.preload(name);
    }
    // Re-runs only when the present routes, navigation, or policy list change. `state.routes`
    // changing identity is exactly when a route lands or is removed, so re-preload-after-removal
    // still fires. The dep'd identities are stable per render (the builder returns new arrays only
    // on real change; callers memoize the policy list).
  }, [state.routes, navigation, routeNamesToPreload]);
}
