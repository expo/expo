'use client';
import { useEffectEvent, useLayoutEffect, useMemo, useState } from 'react';

import { useEnqueueRoutingIntent } from '../../global-state/routingQueueContext';
import { matchDynamicName } from '../../matchers';
import {
  INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME,
  type InternalNavigationOptions,
} from '../../navigationParams';
import type { NavigationState } from '../../react-navigation/routers';
import { createRouteKeyMinter } from '../../react-navigation/routers/stateKeys';
import type { DescribeRouteInternal } from '../../standard-navigation';
import type { PlaceholderDescriptorMap } from '../../standard-navigation/types';
import type { UnknownInputParams } from '../../types';
import { getSingularId } from '../../utils/getSingularId';

export const SYNC_REQUIRED_SCREENS = 'SYNC_REQUIRED_SCREENS';

type Route = NavigationState['routes'][number];

/**
 * Routes to add below the focused route. `routeKeySeq` is the next free key sequence after minting
 * `routes`.
 */
type RequiredRoutes = { routes: readonly Route[]; routeKeySeq: number };

export type SyncRequiredScreensPayload = RequiredRoutes & { routeKey: string };

/**
 * Adds `required` directly below the focused route, in order. Skips a route when a route with the
 * same name and path params is already at or below the focused one.
 */
export function insertRequiredRoutes<State extends NavigationState>(
  state: State,
  required: RequiredRoutes | undefined
): State {
  const added = (required?.routes ?? []).filter((route) => !isAtOrBelowFocus(state, route));
  if (!required || added.length === 0) {
    return state;
  }
  // An action, such as a preload, can mint the key of an added route before the sync. The added
  // route keeps its key because the stack already rendered it. The other route is dropped, because
  // a preload is only a hint.
  const addedKeys = new Set(added.map((route) => route.key));
  const routes = state.routes.filter((route) => !addedKeys.has(route.key));
  const index = routes.indexOf(state.routes[state.index]!);
  return {
    ...state,
    index: index + added.length,
    routeKeySeq: Math.max(state.routeKeySeq, required.routeKeySeq),
    // A required route has the base route shape that every navigator state accepts.
    routes: routes.toSpliced(index, 0, ...(added as State['routes'])),
  };
}

function isAtOrBelowFocus(
  state: NavigationState,
  route: Pick<Route, 'name' | 'params'>,
  added: readonly Route[] = []
) {
  const id = getSingularId(route.name, { params: route.params });
  return [...state.routes.slice(0, state.index + 1), ...added].some(
    ({ name, params }) => name === route.name && getSingularId(name, { params }) === id
  );
}

/** Creates keyed routes for the required screens of the focused route that the stack misses. */
function createRequiredRoutes<NavigatorOptions extends object>(
  state: NavigationState,
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>
): RequiredRoutes | undefined {
  const focused = state.routes[state.index];
  // The stack screen props add this internal option; it is not in the public option types.
  const options = focused && (descriptors[focused.key]?.options as InternalNavigationOptions);
  const screens = options?.[INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME];
  if (!focused || !screens) {
    return undefined;
  }
  const minter = createRouteKeyMinter(state);
  const routes = screens.reduce<Route[]>((added, screen) => {
    const { name, params } =
      typeof screen === 'string'
        ? { name: screen, params: getPathParams(screen, focused.params) }
        : screen;
    if (!state.routeNames.includes(name) || isAtOrBelowFocus(state, { name, params }, added)) {
      return added;
    }
    return [...added, { key: minter.mint(name), name, ...(params && { params }) }];
  }, []);
  return routes.length > 0 ? { routes, routeKeySeq: minter.routeKeySeq } : undefined;
}

/** Copies the focused route params that fill the dynamic segments of `name`. */
function getPathParams(name: string, focusedParams: object | undefined) {
  if (!focusedParams) {
    return undefined;
  }
  // Route params are always a plain record.
  const params = focusedParams as Record<string, unknown>;
  const entries = name.split('/').flatMap((segment) => {
    const param = matchDynamicName(segment)?.name;
    return param !== undefined && params[param] !== undefined ? [[param, params[param]]] : [];
  });
  // The values come from the focused route's path params, which have the input param types.
  return entries.length > 0 ? (Object.fromEntries(entries) as UnknownInputParams) : undefined;
}

/**
 * Adds the required screens of the focused route, with their descriptors, when the route enters
 * the stack. Then syncs them to the global state. A prop change or a back action adds nothing.
 */
export function useRequiredScreensBelow<
  State extends NavigationState,
  NavigatorOptions extends object,
>(
  state: State,
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>,
  describe: DescribeRouteInternal<NavigatorOptions>
) {
  const enqueue = useEnqueueRoutingIntent();
  const [arrival, setArrival] = useState(() => ({
    state,
    required: createRequiredRoutes(state, descriptors),
  }));
  let required = arrival.required;
  if (arrival.state !== state) {
    const routeKey = state.routes[state.index]?.key;
    const previous = arrival.state;
    if (routeKey === previous.routes[previous.index]?.key) {
      // Keep the routes that the global state does not have yet, with the same keys. Then a sync
      // that comes after another action, such as a preload, keeps the screens mounted.
      const routes = required?.routes.filter((route) => !isAtOrBelowFocus(state, route));
      required = required && routes?.length ? { ...required, routes } : undefined;
    } else {
      // Preloaded routes above the index are not in the stack yet.
      const isInStack = previous.routes
        .slice(0, previous.index + 1)
        .some((route) => route.key === routeKey);
      required = isInStack ? undefined : createRequiredRoutes(state, descriptors);
    }
    setArrival({ state, required });
  }

  const shownState = useMemo(() => insertRequiredRoutes(state, required), [state, required]);
  const added = shownState.routes.slice(state.index, shownState.index);
  const addedKeys = added.length > 0 ? added.map((route) => route.key).join('\0') : undefined;
  const shownDescriptors =
    added.length > 0
      ? {
          ...descriptors,
          ...Object.fromEntries(
            added.map((route) => [route.key, describe(route, { create: true })])
          ),
        }
      : descriptors;

  const sync = useEffectEvent(() => {
    const routeKey = state.routes[state.index]?.key;
    if (!required || !routeKey) {
      return;
    }
    const payload: SyncRequiredScreensPayload = { ...required, routeKey };
    enqueue({
      type: 'ACTION',
      payload: {
        action: { type: SYNC_REQUIRED_SCREENS, payload, target: state.key },
        originKey: state.key,
      },
    });
  });

  useLayoutEffect(() => {
    if (addedKeys !== undefined) {
      sync();
    }
  }, [addedKeys]);

  return { state: shownState, descriptors: shownDescriptors };
}
