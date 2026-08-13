import isEqual from 'fast-deep-equal';
import { type RefObject, useEffect, useRef, useState } from 'react';

import { routingQueue, type RoutingIntent } from '../global-state/routingQueue';
import { useExpoRouterStore } from '../global-state/storeContext';
import { getRootStackRouteNames } from '../global-state/utils';
import {
  type LinkingOptions,
  findFocusedRoute,
  type NavigationContainerRef,
  type NavigationState,
  type ParamListBase,
  type PartialState,
} from '../react-navigation/native';
import { getHistoryLength } from '../utils/stack';
import { createMemoryHistory } from './createMemoryHistory';
import { appendBaseUrl } from './getPathFromState';

type GetStateFromPath = NonNullable<LinkingOptions<ParamListBase>['getStateFromPath']>;
type GetPathFromState = NonNullable<LinkingOptions<ParamListBase>['getPathFromState']>;
type ResetState = NavigationState | PartialState<NavigationState>;

/**
 * Find the matching navigation state that changed between 2 navigation states
 * e.g.: a -> b -> c -> d and a -> b -> c -> e -> f, if history in b changed, b is the matching state
 */
const findMatchingState = <T extends NavigationState>(
  a: T | undefined,
  b: T | undefined
): [T | undefined, T | undefined] => {
  if (a === undefined || b === undefined || a.key !== b.key) {
    return [undefined, undefined];
  }

  // Tab and drawer will have `history` property, but stack will have history in `routes`
  const aHistoryLength = getHistoryLength(a);
  const bHistoryLength = getHistoryLength(b);

  const aRoute = a.routes[a.index]!;
  const bRoute = b.routes[b.index]!;

  const aChildState = aRoute.state as T | undefined;
  const bChildState = bRoute.state as T | undefined;

  // Stop here if this is the state object that changed:
  // - history length is different
  // - focused routes are different
  // - one of them doesn't have child state
  // - child state keys are different
  if (
    aHistoryLength !== bHistoryLength ||
    aRoute.key !== bRoute.key ||
    aChildState === undefined ||
    bChildState === undefined ||
    aChildState.key !== bChildState.key
  ) {
    return [a, b];
  }

  return findMatchingState(aChildState, bChildState);
};

/** Run async function in series as it's called. */
const series = (cb: () => Promise<void>) => {
  let queue = Promise.resolve();
  return () => {
    queue = queue.then(cb);
  };
};

export function useBrowserHistorySync({
  ref,
  enabled,
  config,
  getStateFromPath,
  getPathFromState,
  onUnhandledLinking,
}: {
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>;
  enabled: boolean;
  config: LinkingOptions<ParamListBase>['config'];
  getStateFromPath: GetStateFromPath;
  getPathFromState: GetPathFromState;
  onUnhandledLinking: (path: string | undefined) => void;
}) {
  const store = useExpoRouterStore();
  const [history] = useState(createMemoryHistory);
  const configRef = useRef(config);
  const getStateFromPathRef = useRef(getStateFromPath);
  const getPathFromStateRef = useRef(getPathFromState);
  const previousIndexRef = useRef<number | undefined>(undefined);
  const previousStateRef = useRef<NavigationState | undefined>(undefined);
  const nextHistoryOperationIdRef = useRef(0);
  const pendingHistoryOperationsRef = useRef<{ id: number; path: string }[]>([]);

  useEffect(() => {
    configRef.current = config;
    getStateFromPathRef.current = getStateFromPath;
    getPathFromStateRef.current = getPathFromState;
  });

  useEffect(() => {
    previousIndexRef.current = history.index;

    const unsubscribe = history.listen(() => {
      const navigation = ref.current;

      if (!navigation || !enabled) {
        return;
      }

      const { location } = window;
      const path = location.pathname + location.search + location.hash;
      const index = history.index;
      const previousIndex = previousIndexRef.current ?? 0;

      previousIndexRef.current = index;
      const operation = { id: nextHistoryOperationIdRef.current++, path };
      const queueHistoryIntent = (intent: RoutingIntent) => {
        intent.metadata = { history: operation };
        intent.onDispatch = (metadata) => {
          if (metadata?.history) {
            pendingHistoryOperationsRef.current.push(metadata.history);
          }
        };
        routingQueue.add(intent);
      };
      const reset = (state: ResetState) => ({
        type: 'RESET',
        payload: state,
        target: ('key' in state ? state.key : undefined) ?? navigation.getRootState()?.key,
      });

      // Saved state is authoritative: parsing its URL again would lose route keys and nested history.
      const record = history.get(index);
      if (record?.path === path && record?.state) {
        queueHistoryIntent({
          type: 'ACTION',
          payload: { action: reset(record.state) },
        });
        return;
      }

      const state = getStateFromPathRef.current(path, configRef.current);
      if (state) {
        onUnhandledLinking(path);
        // Expo Router's root navigator contains only the internal slot route.
        const routeNames = getRootStackRouteNames();
        if (state.routes.some((route) => !routeNames.includes(route.name))) {
          return;
        }

        if (
          index > previousIndex ||
          /*
           * Hash links emit popstate without changing the memory-history index. Treat a hash added
           * to the current record as forward navigation instead of restoring the current state.
           */
          (index === previousIndex && (!record || `${record?.path}${location.hash}` === path))
        ) {
          queueHistoryIntent({
            type: 'NAVIGATE_TO_HREF',
            payload: { href: path, options: { event: 'NAVIGATE' } },
          });
        } else {
          queueHistoryIntent({
            type: 'ACTION',
            payload: { action: reset(state) },
          });
        }
      } else {
        const initialState = history.get(0)?.state;
        if (initialState) {
          queueHistoryIntent({
            type: 'ACTION',
            payload: { action: reset(initialState) },
          });
        } else {
          pendingHistoryOperationsRef.current = [];
        }
      }
    });

    return () => {
      unsubscribe();
      pendingHistoryOperationsRef.current = [];
    };
  }, [enabled, history, onUnhandledLinking, ref]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const getPathForRoute = (
      route: ReturnType<typeof findFocusedRoute>,
      state: NavigationState
    ): string => {
      let path;

      // Preserve the original URL for wildcard routes while the route and params still match.
      if (route?.path) {
        const stateForPath = getStateFromPathRef.current(route.path, configRef.current);

        if (stateForPath) {
          const focusedRoute = findFocusedRoute(stateForPath);

          if (
            focusedRoute &&
            focusedRoute.name === route.name &&
            isEqual({ ...focusedRoute.params }, { ...route.params })
          ) {
            path = appendBaseUrl(route.path);
          }
        }
      }

      return path ?? getPathFromStateRef.current(state, configRef.current);
    };

    if (ref.current) {
      const rootState = ref.current.getRootState();
      const state = store.state as NavigationState;

      if (state) {
        const path = getPathForRoute(findFocusedRoute(state), state);
        previousStateRef.current ??= rootState;
        history.replace({ path, state });
      }
    }

    const onStateChange = async () => {
      const navigation = ref.current;

      if (!navigation || !enabled) {
        return;
      }

      const previousState = previousStateRef.current;
      const rootState = navigation.getRootState();
      const state = store.state as NavigationState;

      if (!state) {
        return;
      }

      const path = getPathForRoute(findFocusedRoute(state), state);
      let pendingOperation: { id: number; path: string } | undefined;

      // React may batch multiple queued actions into one state event, so use the latest matching operation.
      const pendingOperationIndex = pendingHistoryOperationsRef.current.findLastIndex(
        (operation) => operation.path === path
      );
      if (pendingOperationIndex !== -1) {
        pendingOperation = pendingHistoryOperationsRef.current[pendingOperationIndex];
        pendingHistoryOperationsRef.current.splice(0, pendingOperationIndex + 1);
      }
      if (!pendingOperation) {
        // Do not let a failed, redirected, or otherwise unmatched operation affect later navigation.
        pendingHistoryOperationsRef.current.shift();
      }

      previousStateRef.current = rootState;
      const [previousFocusedState, focusedState] = findMatchingState(previousState, state);

      if (
        previousFocusedState &&
        focusedState &&
        // A matching popstate already changed the browser URL, so don't write another entry.
        !pendingOperation
      ) {
        const historyDelta =
          getHistoryLength(focusedState) - getHistoryLength(previousFocusedState);

        if (historyDelta > 0) {
          history.push({ path, state });
        } else if (historyDelta < 0) {
          const nextIndex = history.backIndex({ path });
          const currentIndex = history.index;

          try {
            if (
              nextIndex !== -1 &&
              nextIndex < currentIndex &&
              history.get(nextIndex - currentIndex)
            ) {
              await history.go(nextIndex - currentIndex);
            } else {
              await history.go(historyDelta);
            }

            history.replace({ path, state });
          } catch {
            // The navigation was interrupted.
          }
        } else {
          history.replace({ path, state });
        }
      } else {
        history.replace({ path, state });
      }
    };

    // Serialize writes because `history.go` is asynchronous and can be interrupted by another write.
    return ref.current?.addListener('state', series(onStateChange));
  }, [enabled, history, ref]);
}
