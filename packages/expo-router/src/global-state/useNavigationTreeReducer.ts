'use client';

import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { collectMissingLayouts, loadLayouts } from '../layoutAnchor';
import { warnIfScreenParam } from '../navigationParams';
import { deepFreeze } from '../react-navigation/core/deepFreeze';
import type {
  InitialState,
  NavigationAction,
  NavigationState,
  RouterBrowserHistoryAction,
} from '../react-navigation/routers';
import { getChainFromStateKey } from '../react-navigation/routers/stateKeys';
import useLatestCallback from '../utils/useLatestCallback';
import {
  applyRouterHistoryAction,
  createBrowserHistory,
  restoreNavigationFromBrowser,
  updateCurrentHistoryEntry,
} from './browserHistory';
import type { BrowserHistory, BrowserHistoryEvent } from './browserHistory.types';
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

// React IDs can repeat after a reload; the session prefix keeps old browser entries distinct.
const browserHistorySessionId = nanoid();

type ReducerConfig = {
  registry: RouterRegistry;
  routesWithRemovalPrevented: ReadonlySet<string>;
  routeNode?: RouteNode;
  linking?: ExpoLinkingOptions;
  redirects?: StoreRedirects[];
  browserHistoryIdPrefix: string;
};

type QueuedOperation = (
  | Exclude<RoutingIntent, { type: 'BROWSER_HISTORY_CHANGED' }>
  | (Extract<RoutingIntent, { type: 'BROWSER_HISTORY_CHANGED' }> & {
      /**
       * Browser traversal may interrupt a suspended transition. Restore from the last committed
       * result so commands from the abandoned transition are not applied later.
       */
      commitedTreeResult?: NavigationTreeResult;
    })
) & {
  // Queued operations wait for missing layouts. Direct actions apply at once.
  deferrable?: { inTransition: boolean };
};

type TreeOperation =
  | QueuedOperation
  // `failed` layouts could not load, so the replay skips their anchors.
  | { type: 'RESUME'; failed: RouteNode[] }
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
    }
  | {
      type: 'route-preloaded';
      routeKey: string;
      state: NavigationState;
    }
  | BrowserHistoryEvent;

export type NavigationTreeReportEvent = NavigationTreeReportEventData & {
  id: number;
};

type NavigationTreeResult = {
  state: NavigationState;
  report: NavigationTreeReport | undefined;
  eventSeq: number;
  // Web only; browser entries tracked by this page.
  history: BrowserHistory | undefined;
  browserHistoryAction?: RouterBrowserHistoryAction;
  // Queued operations that wait for layout modules, in order.
  deferred?: {
    operations: QueuedOperation[];
    missing: RouteNode[];
    // Resume as a transition only if every waiting operation was one.
    inTransition: boolean;
  };
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
  if (operation.type === 'RESUME') {
    if (!result.deferred) {
      return result;
    }
    // Replays go through the same path, so an operation that needs another layout waits again.
    const failed = new Set(operation.failed);
    return result.deferred.operations.reduce<NavigationTreeResult>(
      (current, deferred) => reduceQueuedOperation(current, deferred, config, failed),
      { ...result, deferred: undefined }
    );
  }
  if (operation.type === 'BROWSER_HISTORY_CHANGED') {
    const { commitedTreeResult, ...change } = operation;
    // Waiting operations never reached the screen or the browser, so the browser change drops them.
    result = commitedTreeResult
      ? // Discard the interrupted transition while keeping event IDs monotonic.
        { ...commitedTreeResult, eventSeq: result.eventSeq, deferred: undefined }
      : { ...result, deferred: undefined };
    return reduceQueuedOperation(result, change, config);
  }
  if ('deferrable' in operation && operation.deferrable) {
    return reduceQueuedOperation(result, operation, config);
  }
  const { value, missing } = collectMissingLayouts(() =>
    reduceOperation(result, operation, config)
  );
  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    // TODO(@ubax): move console side effects out of the reducer.
    console.warn(
      `Expo Router handled "${operation.type === 'ACTION' ? operation.payload.action.type : operation.type}" before the layouts ${missing.map((node) => `"${node.contextKey}"`).join(', ')} loaded, so their \`unstable_settings.anchor\` is skipped.`
    );
  }
  return value;
}

function reduceQueuedOperation(
  result: NavigationTreeResult,
  operation: QueuedOperation,
  config: ReducerConfig,
  failedLayouts?: ReadonlySet<RouteNode>
): NavigationTreeResult {
  const inTransition = operation.deferrable?.inTransition ?? false;
  if (result.deferred) {
    const { operations, missing } = result.deferred;
    return {
      ...result,
      deferred: {
        operations: [...operations, operation],
        missing,
        inTransition: result.deferred.inTransition && inTransition,
      },
    };
  }
  const { value, missing } = collectMissingLayouts(
    () => reduceOperation(result, operation, config),
    failedLayouts
  );
  if (missing.length === 0) {
    return value;
  }
  // TODO(@ubax): show a pending UI or a Suspense fallback while the layout chunk loads.
  return { ...result, deferred: { operations: [operation], missing, inTransition } };
}

// Browser changes restore a saved navigation state. Other operations update navigation first,
// then queue the matching browser command to run after React commits.
function reduceOperation(
  result: NavigationTreeResult,
  operation: Exclude<TreeOperation, { type: 'RESUME' }>,
  config: ReducerConfig
): NavigationTreeResult {
  if (operation.type === 'BROWSER_HISTORY_CHANGED') {
    if (!result.history) {
      return result;
    }
    const restored = restoreNavigationFromBrowser(
      result.history,
      result,
      operation.payload,
      config,
      (current, intent) => reduceTree(current, intent, config)
    );
    return appendReportEvents({ ...restored.result, history: restored.history }, restored.events);
  }

  const next = reduceTree({ ...result, browserHistoryAction: undefined }, operation, config);
  if (next.state === result.state || !next.history) {
    return next;
  }
  // Structural repairs are not navigations, so they never move the browser.
  const projected =
    operation.type === 'NAVIGATOR_UNMOUNTED' || operation.type === 'NAVIGATOR_CHANGED'
      ? updateCurrentHistoryEntry(next.history, next.state, config)
      : applyRouterHistoryAction(next.history, next.state, config, next.browserHistoryAction);
  return appendReportEvents({ ...next, history: projected.history }, projected.events);
}

// Browser changes are handled above because they restore tracked history and may call this
// helper with a generated navigation intent. Excluding them prevents a recursive restore.
function reduceTree(
  result: NavigationTreeResult,
  operation: Exclude<TreeOperation, { type: 'BROWSER_HISTORY_CHANGED' | 'RESUME' }>,
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
          options.__internal__PreviewKey,
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
      return reduceTree(result, { type: 'ACTION', payload: { action: resolution.action } }, config);
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
      return reduceTree(
        result,
        {
          type: 'ACTION',
          payload: { action, originKey: operation.payload.originKey },
        },
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
        return reportUnhandledAction(result, operation.payload.action);
      }

      const reduction = reduceNavigationTree(operation.payload.action, config.registry, {
        origin,
        tree,
      });
      if (!reduction.handled) {
        return reportUnhandledAction(result, operation.payload.action);
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
              ...(operation.payload.action.type === 'PRELOAD' &&
              reduction.affectedRouteKey !== undefined
                ? ([
                    {
                      type: 'route-preloaded',
                      routeKey: reduction.affectedRouteKey,
                      state: committedState,
                    },
                  ] satisfies NavigationTreeReportEventData[])
                : []),
              {
                type: 'action-dispatched',
                action: operation.payload.action,
                state: committedState,
              },
            ];
      return appendReportEvents(
        { ...result, state: committedState, browserHistoryAction: reduction.browserHistory },
        eventsWithoutIds
      );
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

function reportUnhandledAction(
  result: NavigationTreeResult,
  action: NavigationAction
): NavigationTreeResult {
  return process.env.NODE_ENV === 'production'
    ? result
    : appendReportEvents(result, [{ type: 'unhandled-action', action }]);
}

function appendReportEvents(
  result: NavigationTreeResult,
  events: NavigationTreeReportEventData[]
): NavigationTreeResult {
  if (events.length === 0) {
    return result;
  }
  const eventsWithIds: NavigationTreeReportEvent[] = events.map((event, index) => ({
    ...event,
    id: result.eventSeq + index,
  }));
  return {
    ...result,
    report: {
      events: result.report ? [...result.report.events, ...eventsWithIds] : eventsWithIds,
    },
    eventSeq: result.eventSeq + eventsWithIds.length,
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
  const browserHistoryIdPrefix = `${browserHistorySessionId}:${React.useId()}`;
  const config: ReducerConfig = {
    registry,
    routesWithRemovalPrevented,
    routeNode,
    linking,
    redirects,
    browserHistoryIdPrefix,
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
      const state = deepFreeze(value);
      const initial = createBrowserHistory(state, config);
      return appendReportEvents(
        { state, report: undefined, eventSeq: 0, history: initial.history },
        initial.events
      );
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

  const processIntent = useLatestCallback((intent: RoutingIntent, inTransition = false) => {
    const deferrable = { inTransition };
    if (intent.type === 'BROWSER_HISTORY_CHANGED') {
      // Example: A is visible while a push to B is suspended. Browser Back starts from A,
      // so restore from A's committed result, not the reducer's pending B state.
      // useLatestCallback keeps `result` at the last commit; the browser's ID and URL still pass through.
      reactDispatch({ ...intent, commitedTreeResult: result, deferrable });
      return;
    }
    reactDispatch({ ...intent, deferrable });
  });

  const resume = React.useEffectEvent((failed: RouteNode[]) => {
    const dispatchResume = () => reactDispatch({ type: 'RESUME', failed });
    if (result.deferred?.inTransition) {
      React.startTransition(dispatchResume);
    } else {
      dispatchResume();
    }
  });
  const missingLayouts = result.deferred?.missing;
  React.useEffect(() => {
    if (!missingLayouts) {
      return;
    }
    let cancelled = false;
    loadLayouts(missingLayouts).then((failed) => {
      if (!cancelled) {
        resume(failed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [missingLayouts]);

  React.useInsertionEffect(() => {
    warnIfStaleState(result.state);
  }, [result.state]);

  return {
    state: result.state,
    isWaitingForLayouts: result.deferred !== undefined,
    report: result.report,
    consumeReportEvents,
    resetNavigator,
    handleAction,
    processIntent,
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
