'use client';
import * as React from 'react';

import type { BackBehavior, NavigationState } from './routers';
import { getBackStackAnchorName, TabActions } from './routers/TabRouter';

/**
 * Keep a tab navigator's implicit back-stack anchor (the route GO_BACK ultimately lands on) loaded
 * at the FRONT of `routes`, so a deep link straight to a non-anchor tab still has the anchor beneath
 * it. `getStateFromPath` only materializes anchors declared via `unstable_settings.anchor`; the
 * implicit firstRoute/initialRoute anchor is kept alive here instead.
 *
 * `firstRoute`/`initialRoute` are the only behaviors with an implicit anchor — the others resolve to
 * `undefined` and this is a no-op. When the anchor is absent it's dispatched via `FRONT_PRELOAD`,
 * which inserts it at index 0 (unlike plain `PRELOAD`, which appends to the tail). Callers must keep
 * the anchor OUT of the `usePreloadRoutes` list so the two don't race for the same route.
 */
export function usePreloadAnchor(
  state: Pick<NavigationState, 'routes' | 'routeNames'>,
  navigation: { dispatch: (action: ReturnType<typeof TabActions.frontPreload>) => void },
  backBehavior: BackBehavior | undefined,
  initialRouteName: string | undefined
): void {
  const anchorName = getBackStackAnchorName(state.routeNames, backBehavior, initialRouteName);

  React.useEffect(() => {
    if (anchorName === undefined) {
      return;
    }
    if (!state.routes.some((route) => route.name === anchorName)) {
      navigation.dispatch(TabActions.frontPreload(anchorName));
    }
  }, [state.routes, navigation, anchorName]);
}
