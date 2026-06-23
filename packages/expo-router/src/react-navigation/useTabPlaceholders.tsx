'use client';
import * as React from 'react';

import { getRouteKey } from './routers/getRouteKey';
import type { NavigationState, Route } from './routers';

// The shape `describe` and the descriptor map share. We only touch these fields here; the navigator
// passes the fully-typed versions through.
type MinimalDescriptor = {
  route: Route<string>;
  options: object;
  render: () => React.ReactElement | null;
  navigation: unknown;
};

type Describe = (route: Route<string>, placeholder: boolean) => MinimalDescriptor;

/**
 * Augment `state` and `descriptors` with PLACEHOLDER routes for declared tabs that haven't
 * materialized yet, so the tab bar shows every tab from the first frame.
 *
 * Each placeholder's key is `getRouteKey(pathname, name, 0)` — identical to the key the router
 * assigns when the route first materializes at index 0. Matching keys mean react-native-screens
 * RECONCILES the native screen instead of remounting it when the real route arrives.
 *
 * Placeholder options are resolved through `describe` UP FRONT: RN 7.2's static screen tree reads
 * options once and ignores later mutations, so they must be correct when the placeholder is created.
 * The placeholder's `render` returns `null` — it only reserves the tab slot.
 *
 * `routeNamesToShow` is the caller's policy (declaration order); the augmented `routes` follow it so
 * the bar shows tabs in order. The returned descriptor map holds both real and placeholder entries —
 * Phase 4's tab-press / `onTabChange` reads from this map.
 */
export function useTabPlaceholders<State extends NavigationState, Descriptors extends Record<string, MinimalDescriptor>>(
  state: State,
  descriptors: Descriptors,
  describe: Describe,
  pathname: string | undefined,
  routeNamesToShow: readonly string[]
): [State, Descriptors] {
  return React.useMemo(() => {
    const present = new Map(state.routes.map((route) => [route.name, route]));

    const orderedRoutes: Route<string>[] = [];
    const augmentedDescriptors: Record<string, MinimalDescriptor> = { ...descriptors };

    for (const name of routeNamesToShow) {
      const real = present.get(name);
      if (real) {
        orderedRoutes.push(real);
        continue;
      }

      // Placeholder route uses the key the router will assign at index 0, so the real route
      // reconciles onto it later.
      const key = getRouteKey(pathname, name, 0);
      const placeholderRoute: Route<string> = { key, name };
      orderedRoutes.push(placeholderRoute);

      const resolved = describe(placeholderRoute, true);
      augmentedDescriptors[key] = { ...resolved, render: renderPlaceholder };
    }

    // `orderedRoutes` is reordered to declaration order, so the original `state.index` no longer
    // points at the focused route. Re-resolve the focused index by the focused route's key.
    const focusedKey = state.routes[state.index]?.key;
    const focusedIndex = orderedRoutes.findIndex((route) => route.key === focusedKey);

    // `focusedIndex < 0` means the focused route isn't in the shown set — an invariant violation.
    // Fall back to 0 (always valid for the non-empty `orderedRoutes`); `state.index` would index a
    // different, possibly shorter array and could point out of range.
    let index = focusedIndex;
    if (index < 0) {
      if (__DEV__) {
        console.warn(
          `The focused tab route is not in the set of shown tabs. Defaulting to the first tab. ` +
            `This indicates an invariant violation: the focused route should always be shown.`
        );
      }
      index = 0;
    }

    const augmentedState = {
      ...state,
      routes: orderedRoutes,
      index,
    } as State;
    return [augmentedState, augmentedDescriptors as Descriptors];
    // `describe` is intentionally excluded: it's a fresh closure each render (no hit if included),
    // but it reads only `state`-derived data already in the deps, so excluding it is safe and keeps
    // the memo stable across unrelated re-renders.
  }, [state, descriptors, pathname, routeNamesToShow]);
}

// Placeholder screens render nothing; they only reserve the tab slot until the real route arrives.
function renderPlaceholder(): null {
  return null;
}
