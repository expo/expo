import isEqual from 'fast-deep-equal';
import { type RefObject, use, useEffect, useRef, useState } from 'react';

import {
  completeParsedState,
  createSeededRootState,
} from '../global-state/createSeededNavigationState';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import type { RoutingIntent } from '../global-state/routingQueue';
import { useEnqueueRoutingIntent } from '../global-state/routingQueueContext';
import { StoreContext } from '../global-state/storeContext';
import { getRootStackRouteNames } from '../global-state/utils';
import {
  type LinkingOptions,
  findFocusedRoute,
  getPathFromState as getPathFromStateDefault,
  getStateFromPath as getStateFromPathDefault,
  type NavigationContainerRef,
  type NavigationState,
  type ParamListBase,
  type PartialState,
} from '../react-navigation/native';
import { ROOT_CHAIN } from '../react-navigation/routers/stateKeys';
import { getHistoryLength } from '../utils/stack';
import { createMemoryHistory } from './createMemoryHistory';
import { extractExpoPathFromURL } from './extractPathFromURL';
import { appendBaseUrl } from './getPathFromState';

const linkingHandlers: symbol[] = [];

type Options = LinkingOptions<ParamListBase>;
type GetStateFromPath = NonNullable<LinkingOptions<ParamListBase>['getStateFromPath']>;
type GetPathFromState = NonNullable<LinkingOptions<ParamListBase>['getPathFromState']>;
type ResetState = NavigationState | PartialState<NavigationState>;

export function useLinking(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>,
  {
    prefixes,
    config,
    getInitialURL = getInitialURLWithTimeout,
    getStateFromPath = getStateFromPathDefault,
    getPathFromState = getPathFromStateDefault,
  }: Options,
  onUnhandledLinking: (lastUnhandledLining: string | undefined) => void
) {
  const store = use(StoreContext);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (linkingHandlers.length) {
      console.error(
        [
          'Looks like you have configured linking in multiple places. This is likely an error since deep links should only be handled in one place to avoid conflicts. Make sure that:',
          "- You don't have multiple NavigationContainers in the app",
          '- Only a single instance of the root component is rendered',
        ]
          .join('\n')
          .trim()
      );
    }

    const handler = Symbol();

    linkingHandlers.push(handler);

    return () => {
      const index = linkingHandlers.indexOf(handler);

      if (index > -1) {
        linkingHandlers.splice(index, 1);
      }
    };
  }, []);

  // `useThenable` only consumes this function from the first render, keeping initialization options consistent.
  const getInitialState = () => {
    const getStateFromURL = (url: string | null | undefined) => {
      let path = url ? extractExpoPathFromURL(prefixes, url) : undefined;
      if (path !== undefined && !path.startsWith('/')) {
        path = `/${path}`;
      }

      const parsedState = path ? getStateFromPath(path, config) : undefined;
      const routeNode = store?.routeNode;
      const state = routeNode
        ? createSeededRootState(parsedState, routeNode)
        : completeParsedState(parsedState, ROOT_CHAIN);

      // If the link were handled, it gets cleared in NavigationContainer
      onUnhandledLinking(path);
      return state;
    };
    const url = getInitialURL();

    if (typeof url !== 'string' && url != null) {
      return url.then(getStateFromURL);
    }

    const state = getStateFromURL(url);

    const thenable = {
      then(onfulfilled?: (state: NavigationState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(state) : state);
      },
      catch() {
        return thenable;
      },
    };

    return thenable as PromiseLike<NavigationState | undefined>;
  };

  useBrowserHistorySync({
    ref,
    config,
    getStateFromPath,
    getPathFromState,
    onUnhandledLinking,
  });

  return {
    getInitialState,
  };
}

export function getInitialURLWithTimeout(): string | null | Promise<string | null> {
  return typeof window === 'undefined' ? '' : window.location.href;
}

/** Find the matching navigation state that changed between two navigation states. */
const findMatchingState = <T extends NavigationState>(
  a: T | undefined,
  b: T | undefined
): [T | undefined, T | undefined] => {
  if (a === undefined || b === undefined || a.key !== b.key) {
    return [undefined, undefined];
  }

  const aHistoryLength = getHistoryLength(a);
  const bHistoryLength = getHistoryLength(b);
  const aRoute = a.routes[a.index]!;
  const bRoute = b.routes[b.index]!;
  const aChildState = aRoute.state as T | undefined;
  const bChildState = bRoute.state as T | undefined;

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

const series = (cb: () => Promise<void>) => {
  let queue = Promise.resolve();
  return () => {
    queue = queue.then(cb);
  };
};

function useBrowserHistorySync({
  ref,
  config,
  getStateFromPath,
  getPathFromState,
  onUnhandledLinking,
}: {
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>;
  config: LinkingOptions<ParamListBase>['config'];
  getStateFromPath: GetStateFromPath;
  getPathFromState: GetPathFromState;
  onUnhandledLinking: (path: string | undefined) => void;
}) {
  const store = use(StoreContext);
  const enqueue = useEnqueueRoutingIntent();
  const [history] = useState(createMemoryHistory);
  const configRef = useRef(config);
  const getStateFromPathRef = useRef(getStateFromPath);
  const getPathFromStateRef = useRef(getPathFromState);
  const previousIndexRef = useRef<number | undefined>(undefined);
  const previousStateRef = useRef<NavigationState | undefined>(undefined);
  // TODO(@ubax): buffer history intent metadata in the reducer and flush it immediately before
  // the matching state event so each operation is correlated with its commit.
  // https://linear.app/expo/issue/ENG-22046
  const pendingHistoryOperationsRef = useRef<{ path: string }[]>([]);

  useEffect(() => {
    configRef.current = config;
    getStateFromPathRef.current = getStateFromPath;
    getPathFromStateRef.current = getPathFromState;
  });

  useEffect(() => {
    previousIndexRef.current = history.index;

    const unsubscribe = history.listen(() => {
      const navigation = ref.current;

      if (!navigation) {
        return;
      }

      const { location } = window;
      const path = location.pathname + location.search + location.hash;
      const index = history.index;
      const previousIndex = previousIndexRef.current ?? 0;

      previousIndexRef.current = index;
      const operation = { path };
      const queueHistoryIntent = (intent: RoutingIntent) => {
        intent.metadata = { history: operation };
        intent.onDispatch = (metadata) => {
          if (metadata?.history) {
            pendingHistoryOperationsRef.current.push(metadata.history);
          }
        };
        enqueue(intent);
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

      const parsedState = getStateFromPathRef.current(
        path,
        configRef.current,
        getRouteInfoFromState(store?.state).segments
      );
      if (parsedState) {
        onUnhandledLinking(path);
        const routeNames = getRootStackRouteNames();
        if (parsedState.routes.some((route) => !routeNames.includes(route.name))) {
          return;
        }
        const state = store?.routeNode
          ? createSeededRootState(parsedState, store.routeNode)
          : completeParsedState(parsedState, ROOT_CHAIN);
        if (!state) {
          return;
        }

        if (
          index > previousIndex ||
          // Hash links emit popstate without changing the memory-history index.
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
  }, [enqueue, history, onUnhandledLinking, ref]);

  useEffect(() => {
    const getPathForRoute = (
      route: ReturnType<typeof findFocusedRoute>,
      state: NavigationState
    ): string => {
      let path;

      // Preserve the original URL for wildcard routes while the route and params still match.
      if (route?.path) {
        const stateForPath = getStateFromPathRef.current(
          route.path,
          configRef.current,
          // TODO(@Ubax): Check if there is a way to do it in a more performant way
          getRouteInfoFromState(state).segments
        );

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
      const state = store?.state as NavigationState | undefined;

      if (state) {
        const path = getPathForRoute(findFocusedRoute(state), state);
        previousStateRef.current ??= rootState;
        history.replace({ path, state });
      }
    }

    const onStateChange = async () => {
      const navigation = ref.current;

      if (!navigation) {
        return;
      }

      const previousState = previousStateRef.current;
      const rootState = navigation.getRootState();
      const state = store?.state as NavigationState | undefined;

      if (!state) {
        return;
      }

      const path = getPathForRoute(findFocusedRoute(state), state);
      let pendingOperation: { path: string } | undefined;

      // React may batch multiple queued actions into one state event, so use the latest match.
      const pendingOperationIndex = pendingHistoryOperationsRef.current.findLastIndex(
        (operation) => operation.path === path
      );
      if (pendingOperationIndex !== -1) {
        pendingOperation = pendingHistoryOperationsRef.current[pendingOperationIndex];
        pendingHistoryOperationsRef.current.splice(0, pendingOperationIndex + 1);
      }
      if (!pendingOperation) {
        // A failed or redirected operation must not affect later navigation.
        pendingHistoryOperationsRef.current.shift();
      }

      previousStateRef.current = rootState;
      const [previousFocusedState, focusedState] = findMatchingState(previousState, state);

      if (previousFocusedState && focusedState && !pendingOperation) {
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
  }, [history, ref]);
}
