'use client';
import { use, useEffectEvent, useLayoutEffect, useState } from 'react';

import { useEnqueueRoutingIntent } from '../../global-state/routingQueueContext';
import { matchDynamicName } from '../../matchers';
import {
  INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME,
  type InternalNavigationOptions,
} from '../../navigationParams';
import { NavigatorStateContext } from '../../react-navigation/core/useNavigationState';
import type { NavigationState } from '../../react-navigation/routers';
import { createRouteKeyMinter } from '../../react-navigation/routers/stateKeys';
import type {
  DescribePlaceholderRoute,
  PlaceholderDescriptorMap,
} from '../../standard-navigation/types';
import type { UnknownInputParams } from '../../types';
import { getSingularId } from '../../utils/getSingularId';
import type { StackScreenProps } from './StackScreen';

type RequiredScreenBelow = NonNullable<StackScreenProps['unstable_requiredScreensBelow']>[number];

export const SYNC_REQUIRED_SCREENS = 'SYNC_REQUIRED_SCREENS';

export type SyncRequiredScreensPayload = {
  routeKey: string;
  screens: readonly RequiredScreenBelow[];
};

/**
 * Adds the missing `screens` directly below the focused route, in the listed order.
 * A screen is missing when no route at or below the focused one has the same name and path params.
 */
export function insertRequiredScreensBelow<State extends NavigationState>(
  state: State,
  screens: readonly RequiredScreenBelow[] | undefined
): State {
  if (!state.routes[state.index] || !screens?.length) {
    return state;
  }
  const minter = createRouteKeyMinter(state);
  const added = screens.reduce<State['routes'][number][]>((routes, screen) => {
    const route = createMissingRoute(state, screen, routes, minter);
    return route ? [...routes, route] : routes;
  }, []);
  if (added.length === 0) {
    return state;
  }
  return {
    ...state,
    index: state.index + added.length,
    routeKeySeq: minter.routeKeySeq,
    routes: state.routes.toSpliced(state.index, 0, ...added),
  };
}

/**
 * Returns a new route for `screen`. Returns `undefined` when the stack has no such screen, or when
 * it already has a matching route at or below the focused one.
 */
function createMissingRoute<State extends NavigationState>(
  state: State,
  screen: RequiredScreenBelow,
  added: readonly State['routes'][number][],
  minter: ReturnType<typeof createRouteKeyMinter>
): State['routes'][number] | undefined {
  const { name, params } =
    typeof screen === 'string'
      ? { name: screen, params: getPathParams(screen, state.routes[state.index]?.params) }
      : screen;
  const id = getSingularId(name, { params });
  const isPresent = [...state.routes.slice(0, state.index + 1), ...added].some(
    (route) => route.name === name && getSingularId(name, { params: route.params }) === id
  );
  if (isPresent || !state.routeNames.includes(name)) {
    return undefined;
  }
  // A new route has the base route shape that every navigator state accepts.
  return { key: minter.mint(name), name, ...(params && { params }) } as State['routes'][number];
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

function getRouteRequiredScreens(
  routeKey: string | undefined,
  descriptors: PlaceholderDescriptorMap
): readonly RequiredScreenBelow[] | undefined {
  // The stack screen props add this internal option; it is not in the public option types.
  const options = routeKey
    ? (descriptors[routeKey]?.options as InternalNavigationOptions | undefined)
    : undefined;
  return options?.[INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME];
}

/**
 * Keeps the required screens of the focused route from the render where a deep link or a
 * navigation added the route. A prop change, or a back action to a route that is already in the
 * stack, adds no screens.
 */
export function useRequiredScreensOnArrival<NavigatorOptions extends object>(
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>,
  state: NavigationState
): PlaceholderDescriptorMap<NavigatorOptions> {
  const routeKey = state.routes[state.index]?.key;
  const screens = getRouteRequiredScreens(routeKey, descriptors);
  const [arrival, setArrival] = useState({ state, screens });
  let arrivalScreens = arrival.screens;
  if (arrival.state !== state) {
    // Preloaded routes above the index are not in the stack yet.
    const isInStack = arrival.state.routes
      .slice(0, arrival.state.index + 1)
      .some((route) => route.key === routeKey);
    arrivalScreens = isInStack ? undefined : screens;
    setArrival({ state, screens: arrivalScreens });
  }
  const descriptor = routeKey ? descriptors[routeKey] : undefined;
  if (!routeKey || !descriptor || arrivalScreens === screens) {
    return descriptors;
  }
  const options = {
    ...descriptor.options,
    [INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME]: arrivalScreens,
  };
  return { ...descriptors, [routeKey]: { ...descriptor, options } };
}

/** Adds descriptors for the required screens that the state does not have yet. */
export function processRequiredScreensDescriptors<
  State extends NavigationState,
  NavigatorOptions extends object,
>(
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>,
  state: State,
  describe: DescribePlaceholderRoute<NavigatorOptions>
): PlaceholderDescriptorMap<NavigatorOptions> {
  const next = insertRequiredScreensBelow(
    state,
    getRouteRequiredScreens(state.routes[state.index]?.key, descriptors)
  );
  if (next === state) {
    return descriptors;
  }
  const added = next.routes.slice(state.index, next.index);
  return {
    ...descriptors,
    ...Object.fromEntries(added.map((route) => [route.key, describe(route, { create: true })])),
  };
}

/** Adds the required screens to the state that the stack renders. */
export function processRequiredScreensState<
  State extends NavigationState,
  NavigatorOptions extends object,
>(state: State, descriptors: PlaceholderDescriptorMap<NavigatorOptions>): State {
  return insertRequiredScreensBelow(
    state,
    getRouteRequiredScreens(state.routes[state.index]?.key, descriptors)
  );
}

/**
 * Writes the required screens that the stack rendered into the global navigation state.
 * The reducer runs the same insertion, so the route keys match when the state did not change.
 */
export function useSyncRequiredScreensBelow(descriptors: PlaceholderDescriptorMap) {
  const enqueue = useEnqueueRoutingIntent();
  // The `state` prop of the navigator content already has the added routes. The context has the
  // state without them, which is what the sync compares against.
  const state = use(NavigatorStateContext);
  const screens = state && getRouteRequiredScreens(state.routes[state.index]?.key, descriptors);
  const next = state && insertRequiredScreensBelow(state, screens);
  // New keys after a sync mean that screens are still missing, so the effect runs again.
  const nextRouteKeys =
    next !== state ? next?.routes.map((route) => route.key).join('\0') : undefined;

  const sync = useEffectEvent(() => {
    const routeKey = state?.routes[state.index]?.key;
    if (!state || !screens || !routeKey) {
      return;
    }
    const payload: SyncRequiredScreensPayload = { routeKey, screens };
    enqueue({
      type: 'ACTION',
      payload: {
        action: { type: SYNC_REQUIRED_SCREENS, payload, target: state.key },
        originKey: state.key,
      },
    });
  });

  useLayoutEffect(() => {
    if (nextRouteKeys !== undefined) {
      sync();
    }
  }, [nextRouteKeys]);
}
