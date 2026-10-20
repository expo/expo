'use client';
import { Children, type ReactNode, use, useEffectEvent, useLayoutEffect } from 'react';

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
import { isChildOfType } from '../../utils/children';
import { getSingularId } from '../../utils/getSingularId';
import { Protected } from '../../views/Protected';
import { StackScreen, type StackScreenProps } from './StackScreen';

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
    ? (descriptors[focusedKey]?.options as InternalNavigationOptions | undefined)
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

// Warn once per cycle, so layout re-renders do not repeat the warning.
const warnedCycles = new Set<string>();

/** Warns in development when the `unstable_requiredScreensBelow` props of `children` form a cycle. */
export function warnIfRequiredScreensCycle(children: ReactNode) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const required = new Map<string, string[]>();
  const collect = (nodes: ReactNode) =>
    Children.forEach(nodes, (child) => {
      if (isChildOfType(child, StackScreen) && child.props.name) {
        required.set(
          child.props.name,
          (child.props.unstable_requiredScreensBelow ?? []).map((screen) =>
            typeof screen === 'string' ? screen : screen.name
          )
        );
      } else if (isChildOfType(child, Protected)) {
        collect(child.props.children);
      }
    });
  collect(children);

  const checked = new Set<string>();
  const findCycle = (name: string, path: string[]): string[] | undefined => {
    if (path.includes(name)) {
      return [...path.slice(path.indexOf(name)), name];
    }
    if (checked.has(name)) {
      return undefined;
    }
    checked.add(name);
    // A screen that lists itself cannot make a back loop, so it is not a cycle.
    for (const below of required.get(name)?.filter((screen) => screen !== name) ?? []) {
      const cycle = findCycle(below, [...path, name]);
      if (cycle) {
        return cycle;
      }
    }
    return undefined;
  };
  for (const name of required.keys()) {
    const cycle = findCycle(name, []);
    // The sorted names identify a cycle, whichever screen it starts from.
    const key = cycle && [...new Set(cycle)].sort().join('\0');
    if (cycle && key && !warnedCycles.has(key)) {
      warnedCycles.add(key);
      console.warn(
        `The \`unstable_requiredScreensBelow\` props of Stack.Screen form a cycle: ${cycle.join(' -> ')}. Each screen in the cycle adds the next one below it when it is focused, so the back action never leaves these screens. Remove a screen from one of these props to break the cycle.`
      );
      return;
    }
  }
}
