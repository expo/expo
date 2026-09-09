'use client';

import * as React from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { warnIfScreenParam } from '../navigationParams';
import { deepFreeze } from '../react-navigation/core/deepFreeze';
import type { InitialState, NavigationAction, NavigationState } from '../react-navigation/routers';
import { getChainFromStateKey } from '../react-navigation/routers/stateKeys';
import useLatestCallback from '../utils/useLatestCallback';
import {
  completeNavigationState,
  createSeededNavigationState,
} from './createSeededNavigationState';
import { getNavigateAction } from './getNavigationAction';
import { indexNavigationTree, reduceNavigationTree, resolveOrigin } from './reduceNavigationTree';
import type { RouterRegistry } from './routerRegistry';
import type { RoutingIntent } from './routingQueue';
import { findStateByKey, resetNavigatorState } from './stateUtils';
import type { StoreRedirects } from './types';

type ReducerConfig = {
  registry: RouterRegistry;
  routesWithRemovalPrevented: ReadonlySet<string>;
  routeNode?: RouteNode;
  linking?: ExpoLinkingOptions;
  redirects?: StoreRedirects[];
};

type TreeOperation =
  | RoutingIntent
  | {
      type: 'NAVIGATOR_UNMOUNTED';
      stateKey: string;
      routeNode: RouteNode;
    }
  | {
      type: 'NAVIGATOR_CHANGED';
      stateKey: string;
      routerType: string | undefined;
    }
  | {
      type: 'REPORT_CONSUMED';
      eventIds: readonly number[];
    };

type Options = {
  initialState: InitialState | undefined;
  routeNode?: RouteNode;
  registry: RouterRegistry;
  routesWithRemovalPrevented?: ReadonlySet<string>;
  linking?: ExpoLinkingOptions;
  redirects?: StoreRedirects[];
};

export type NavigationTreeReport = {
  events: NavigationTreeReportEvent[];
};

type NavigationTreeReportEventData =
  | {
      type: 'unhandled-action';
      action: NavigationAction;
    }
  | {
      type: 'removed-routes';
      routeKeys: readonly string[];
      action: NavigationAction;
    }
  | {
      type: 'prevented-routes';
      routeKeys: readonly string[];
      action: NavigationAction;
    }
  | {
      type: 'action-dispatched';
      action: NavigationAction;
      state: NavigationState;
    };

export type NavigationTreeReportEvent = NavigationTreeReportEventData & {
  id: number;
};

type NavigationTreeResult = {
  state: NavigationState;
  report: NavigationTreeReport | undefined;
  eventSeq: number;
};

const ACTIONS_WITHOUT_REMOVAL_PREVENTION = new Set(['ROUTE_NAMES_CHANGED']);

function warnIfStaleState(state: NavigationState) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  let focusedState: NavigationState | undefined = state;
  while (focusedState) {
    if (focusedState.stale || focusedState.index === undefined) {
      console.error('Detected stale state. This is likely a bug in Expo Router.');
      return;
    }
    focusedState = focusedState.routes[focusedState.index]?.state as NavigationState | undefined;
  }
}

function navigationTreeReducer(
  result: NavigationTreeResult,
  operation: TreeOperation,
  config: ReducerConfig
): NavigationTreeResult {
  const state = result.state;

  switch (operation.type) {
    case 'NAVIGATE_TO_HREF': {
      const { href, options } = operation.payload;
      let resolution: ReturnType<typeof getNavigateAction>;
      try {
        resolution = getNavigateAction(
          href,
          options,
          config,
          options.event,
          options.withAnchor,
          options.dangerouslySingular,
          !!options.__internal__PreviewKey,
          state
        );
      } catch (error) {
        const message =
          typeof error === 'object' && error != null && 'message' in error ? error.message : error;
        // TODO(@ubax): move console side effects out of the reducer.
        console.warn(
          `An error occurred when trying to handle navigation action ${JSON.stringify(operation)}: ${message}`
        );
        return result;
      }
      if (resolution.status === 'invalid') {
        const invalidHref = operation.payload.originalHref ?? resolution.href;
        // TODO(@ubax): move console side effects out of the reducer.
        console.warn(
          `Could not generate a valid navigation state for the given path: ${invalidHref}`
        );
        return result;
      }
      return navigationTreeReducer(
        result,
        { type: 'ACTION', payload: { action: resolution.action } },
        config
      );
    }
    case 'COMPUTED_ACTION': {
      let action: NavigationAction | undefined;
      try {
        action = operation.payload.compute(state, config.registry);
      } catch (error) {
        const message =
          typeof error === 'object' && error != null && 'message' in error ? error.message : error;
        // TODO(@ubax): move console side effects out of the reducer.
        console.warn(
          `An error occurred when trying to handle navigation action ${JSON.stringify(operation)}: ${message}`
        );
        return result;
      }
      if (!action) {
        return result;
      }
      return navigationTreeReducer(
        result,
        { type: 'ACTION', payload: { action, originKey: operation.payload.originKey } },
        config
      );
    }
    case 'ACTION': {
      const tree = indexNavigationTree(state);
      const origin = resolveOrigin(
        tree.rootNode,
        tree.nodes,
        config.registry,
        operation.payload.originKey
      );
      if (!origin) {
        return appendReportEvent(result, {
          type: 'unhandled-action',
          action: operation.payload.action,
        });
      }

      const reduction = reduceNavigationTree(operation.payload.action, config.registry, {
        origin,
        tree,
      });
      if (!reduction.handled) {
        return appendReportEvent(result, {
          type: 'unhandled-action',
          action: operation.payload.action,
        });
      }
      const nextState = config.routeNode
        ? completeNavigationState(reduction.nextState, config.routeNode)
        : reduction.nextState;
      if (nextState === state) {
        return result;
      }

      const removedRoutes = getRemovedRouteKeys(state, nextState);
      const preventedRoutes = ACTIONS_WITHOUT_REMOVAL_PREVENTION.has(operation.payload.action.type)
        ? []
        : removedRoutes.filter((routeKey) => config.routesWithRemovalPrevented.has(routeKey));
      const committedState = preventedRoutes.length > 0 ? state : deepFreeze(nextState);
      // TODO(@ubax): add dev-only diagnostics to events for dev-tools.
      const eventsWithoutIds: NavigationTreeReportEventData[] =
        preventedRoutes.length > 0
          ? [
              {
                type: 'prevented-routes',
                routeKeys: preventedRoutes,
                action: operation.payload.action,
              },
            ]
          : [
              ...(removedRoutes.length > 0
                ? ([
                    {
                      type: 'removed-routes',
                      routeKeys: removedRoutes,
                      action: operation.payload.action,
                    },
                  ] satisfies NavigationTreeReportEventData[])
                : []),
              {
                type: 'action-dispatched',
                action: operation.payload.action,
                state: committedState,
              },
            ];
      const events: NavigationTreeReportEvent[] = eventsWithoutIds.map((event, index) => ({
        ...event,
        id: result.eventSeq + index,
      }));
      const report: NavigationTreeReport = {
        events: result.report ? [...result.report.events, ...events] : events,
      };

      return {
        state: committedState,
        report,
        eventSeq: result.eventSeq + events.length,
      };
    }
    case 'NAVIGATOR_UNMOUNTED': {
      // A still-registered key re-registered before this operation reduced, so it did not unmount.
      if (config.registry.has(operation.stateKey) || !findStateByKey(state, operation.stateKey)) {
        return result;
      }
      const replacement = createSeededNavigationState(
        undefined,
        operation.routeNode,
        getChainFromStateKey(operation.stateKey)
      );
      const nextState = replaceNavigationState(state, operation.stateKey, replacement);
      const completeState = config.routeNode
        ? completeNavigationState(nextState, config.routeNode)
        : nextState;
      return { ...result, state: deepFreeze(completeState) };
    }
    case 'NAVIGATOR_CHANGED': {
      const navigatorState = findStateByKey(state, operation.stateKey);
      if (!navigatorState) {
        return result;
      }
      const replacement = resetNavigatorState(navigatorState, operation.routerType);
      const nextState = replaceNavigationState(state, operation.stateKey, replacement);
      const completeState = config.routeNode
        ? completeNavigationState(nextState, config.routeNode)
        : nextState;
      return { ...result, state: deepFreeze(completeState) };
    }
    case 'REPORT_CONSUMED': {
      if (!result.report) {
        return result;
      }
      const consumedIds = new Set(operation.eventIds);
      const events = result.report.events.filter((event) => !consumedIds.has(event.id));
      if (events.length === result.report.events.length) {
        return result;
      }
      return { ...result, report: events.length > 0 ? { events } : undefined };
    }
  }
}

function appendReportEvent(
  result: NavigationTreeResult,
  event: NavigationTreeReportEventData
): NavigationTreeResult {
  const eventWithId: NavigationTreeReportEvent = { ...event, id: result.eventSeq };
  return {
    ...result,
    report: {
      events: result.report ? [...result.report.events, eventWithId] : [eventWithId],
    },
    eventSeq: result.eventSeq + 1,
  };
}

export function useNavigationTreeReducer({
  initialState,
  routeNode,
  registry,
  routesWithRemovalPrevented = EMPTY_SET,
  linking,
  redirects,
}: Options) {
  const config: ReducerConfig = {
    registry,
    routesWithRemovalPrevented,
    routeNode,
    linking,
    redirects,
  };
  const [result, reactDispatch] = React.useReducer(
    (result: NavigationTreeResult, operation: TreeOperation) =>
      navigationTreeReducer(result, operation, config),
    initialState,
    (value): NavigationTreeResult => {
      validateInitialState(value);
      if (value == null) {
        throw new Error(
          'The navigation container is missing its initial state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
        );
      }
      // TODO(@ubax): check if deepFreeze is needed here.
      return { state: deepFreeze(value), report: undefined, eventSeq: 0 };
    }
  );
  const [previousRegistry, setPreviousRegistry] = React.useState(registry);
  if (previousRegistry !== registry) {
    setPreviousRegistry(registry);
    // Reconcile before commit so registry membership and navigation state stay in sync.
    for (const [stateKey, entry] of previousRegistry) {
      if (!registry.has(stateKey) && entry.routeNode) {
        reactDispatch({
          type: 'NAVIGATOR_UNMOUNTED',
          stateKey,
          routeNode: entry.routeNode,
        });
      }
    }
  }
  const handleAction = useLatestCallback((action: NavigationAction, originKey?: string) => {
    const payload =
      typeof action.payload === 'object' && action.payload !== null ? action.payload : undefined;
    const params =
      payload &&
      'params' in payload &&
      typeof payload.params === 'object' &&
      payload.params !== null
        ? payload.params
        : undefined;
    warnIfScreenParam(params);
    reactDispatch({ type: 'ACTION', payload: { action, originKey } });
  });
  const resetNavigator = useLatestCallback((stateKey: string, routerType: string | undefined) => {
    reactDispatch({ type: 'NAVIGATOR_CHANGED', stateKey, routerType });
  });
  const consumeReportEvents = useLatestCallback((eventIds: readonly number[]) => {
    reactDispatch({ type: 'REPORT_CONSUMED', eventIds });
  });

  React.useInsertionEffect(() => {
    warnIfStaleState(result.state);
  }, [result.state]);

  return {
    state: result.state,
    report: result.report,
    consumeReportEvents,
    resetNavigator,
    handleAction,
    processIntent: reactDispatch,
  };
}

const EMPTY_SET: ReadonlySet<string> = new Set();

function getRemovedRouteKeys(current: NavigationState, next: NavigationState): string[] {
  const nextRouteKeys = new Set<string>();
  visitRoutes(next, true, (routeKey) => nextRouteKeys.add(routeKey));

  const removedRoutes: string[] = [];
  visitRoutes(current, true, (routeKey) => {
    if (!nextRouteKeys.has(routeKey)) {
      removedRoutes.push(routeKey);
    }
  });
  return removedRoutes;
}

function visitRoutes(
  state: NavigationState,
  excludePreloaded: boolean,
  visit: (routeKey: string) => void
) {
  const routes = excludePreloaded
    ? state.routes.filter((route) => !route.isPreloaded)
    : state.routes;
  for (let index = routes.length - 1; index >= 0; index--) {
    const route = routes[index]!;
    if (route.state?.stale === false) {
      visitRoutes(route.state, excludePreloaded, visit);
    }
    visit(route.key);
  }
}

function validateInitialState(
  state: InitialState | undefined
): asserts state is NavigationState | undefined {
  if (state === undefined) {
    return;
  }

  const index = 'index' in state ? state.index : undefined;
  const routeNames = 'routeNames' in state ? state.routeNames : undefined;
  const routeKeySeq = 'routeKeySeq' in state ? state.routeKeySeq : undefined;
  if (
    !('stale' in state) ||
    state.stale !== false ||
    !('key' in state) ||
    typeof state.key !== 'string' ||
    !Number.isInteger(index) ||
    !Number.isInteger(routeKeySeq) ||
    routeKeySeq! < 0 ||
    !Array.isArray(routeNames) ||
    state.routes.some(
      (route) =>
        !('key' in route) || typeof route.key !== 'string' || !routeNames?.includes(route.name)
    ) ||
    (state.routes.length === 0 ? index !== -1 : index! < 0 || index! >= state.routes.length)
  ) {
    throw new Error(
      'The navigation container received an incomplete initial state. Expo Router always seeds a complete initial state with valid `key`, `routeKeySeq`, `index`, `routeNames`, route keys, and `stale: false` at every level, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
    );
  }

  for (const route of state.routes) {
    validateInitialState(route.state);
  }
}

export function replaceNavigationState(
  state: NavigationState,
  stateKey: string,
  replacement: NavigationState
): NavigationState {
  if (state.key === stateKey) {
    return replacement;
  }

  let changed = false;
  const routes = state.routes.map((route) => {
    if (route.state?.stale !== false) {
      return route;
    }
    const nextState = replaceNavigationState(route.state, stateKey, replacement);
    if (nextState === route.state) {
      return route;
    }
    changed = true;
    return { ...route, state: nextState };
  });
  return changed ? { ...state, routes } : state;
}
