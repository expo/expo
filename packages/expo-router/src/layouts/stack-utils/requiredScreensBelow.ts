'use client';
import { use, useEffectEvent, useLayoutEffect } from 'react';

import { useEnqueueRoutingIntent } from '../../global-state/routingQueueContext';
import { matchDynamicName } from '../../matchers';
import { INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME } from '../../navigationParams';
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
  const focused = state.routes[state.index];
  if (!focused || !screens?.length) {
    return state;
  }
  const activeRoutes = state.routes.slice(0, state.index + 1);
  const minter = createRouteKeyMinter(state);
  const added: State['routes'][number][] = [];
  for (const screen of screens) {
    const { name, params } =
      typeof screen === 'string'
        ? { name: screen, params: getPathParams(screen, focused.params) }
        : screen;
    const id = getSingularId(name, { params });
    const isPresent = [...activeRoutes, ...added].some(
      (route) => route.name === name && getSingularId(name, { params: route.params }) === id
    );
    if (!isPresent && state.routeNames.includes(name)) {
      // A new route has the base route shape that every navigator state accepts.
      added.push({
        key: minter.mint(name),
        name,
        ...(params && { params }),
      } as (typeof added)[number]);
    }
  }
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

/** Copies the focused route params that fill the dynamic segments of `name`. */
function getPathParams(name: string, focusedParams: object | undefined) {
  // Route params are always a plain record.
  const params = focusedParams as Record<string, unknown> | undefined;
  const entries = name.split('/').flatMap((segment) => {
    const param = matchDynamicName(segment)?.name;
    return param !== undefined && params?.[param] !== undefined ? [[param, params[param]]] : [];
  });
  // The values come from the focused route's path params, which have the input param types.
  return entries.length > 0 ? (Object.fromEntries(entries) as UnknownInputParams) : undefined;
}

function getFocusedRequiredScreens(
  state: NavigationState,
  descriptors: PlaceholderDescriptorMap
): readonly RequiredScreenBelow[] | undefined {
  const focusedKey = state.routes[state.index]?.key;
  // The stack screen props add this internal option; it is not in the public option types.
  const options = focusedKey
    ? (descriptors[focusedKey]?.options as
        | { [INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME]?: RequiredScreenBelow[] }
        | undefined)
    : undefined;
  return options?.[INTERNAL_EXPO_ROUTER_REQUIRED_SCREENS_BELOW_OPTION_NAME];
}

export function processRequiredScreensDescriptors<
  State extends NavigationState,
  NavigatorOptions extends object,
>(
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>,
  state: State,
  describe: DescribePlaceholderRoute<NavigatorOptions>
): PlaceholderDescriptorMap<NavigatorOptions> {
  const next = insertRequiredScreensBelow(state, getFocusedRequiredScreens(state, descriptors));
  if (next === state) {
    return descriptors;
  }
  const added = next.routes.slice(state.index, next.index);
  return {
    ...descriptors,
    ...Object.fromEntries(added.map((route) => [route.key, describe(route, { create: true })])),
  };
}

export function processRequiredScreensState<
  State extends NavigationState,
  NavigatorOptions extends object,
>(state: State, descriptors: PlaceholderDescriptorMap<NavigatorOptions>): State {
  return insertRequiredScreensBelow(state, getFocusedRequiredScreens(state, descriptors));
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
  const screens = state && getFocusedRequiredScreens(state, descriptors);
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
