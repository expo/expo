'use client';
import { use, useEffectEvent, useLayoutEffect, useMemo, useState } from 'react';

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
 * Returns `state` with the required screens of the focused route only when the route is new to the
 * stack, and syncs them to the global state.
 */
export function useRequiredScreensBelow<State extends { index: number; routes: { key: string }[] }>(
  state: State,
  descriptors: PlaceholderDescriptorMap
): State {
  const enqueue = useEnqueueRoutingIntent();
  // `state` already has the routes that the stack processors added. The context has the global
  // state without them.
  const globalState = use(NavigatorStateContext);
  const routeKey = globalState?.routes[globalState.index]?.key;
  const screens = getRouteRequiredScreens(routeKey, descriptors);
  const [arrival, setArrival] = useState({ globalState, screens });
  let arrivalScreens = arrival.screens;
  if (arrival.globalState !== globalState) {
    // Preloaded routes above the index are not in the stack yet.
    const isInStack = arrival.globalState?.routes
      .slice(0, arrival.globalState.index + 1)
      .some((route) => route.key === routeKey);
    arrivalScreens = isInStack ? undefined : screens;
    setArrival({ globalState, screens: arrivalScreens });
  }
  const next = globalState && insertRequiredScreensBelow(globalState, arrivalScreens);
  const shownRouteKeys = next?.routes.map((route) => route.key).join('\0');
  const nextRouteKeys = next !== globalState ? shownRouteKeys : undefined;

  const sync = useEffectEvent(() => {
    if (!globalState || !arrivalScreens || !routeKey) {
      return;
    }
    const payload: SyncRequiredScreensPayload = { routeKey, screens: arrivalScreens };
    enqueue({
      type: 'ACTION',
      payload: {
        action: { type: SYNC_REQUIRED_SCREENS, payload, target: globalState.key },
        originKey: globalState.key,
      },
    });
  });

  useLayoutEffect(() => {
    if (nextRouteKeys !== undefined) {
      sync();
    }
  }, [nextRouteKeys]);

  // `next` is a new object on each render, so the joined keys keep the result stable.
  return useMemo(() => {
    const shownKeys = new Set(shownRouteKeys?.split('\0'));
    if (shownRouteKeys === undefined || state.routes.every((route) => shownKeys.has(route.key))) {
      return state;
    }
    const routes = state.routes.filter((route) => shownKeys.has(route.key));
    return { ...state, routes, index: routes.findIndex((route) => route.key === routeKey) };
  }, [state, shownRouteKeys, routeKey]);
}
