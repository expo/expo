'use client';
import * as React from 'react';
import { use } from 'react';

import { type ResolveNavigateConfig } from '../../global-state/getNavigationAction';
import {
  type RootNavigationState,
  createRootNavigationReducer,
  rootReducer,
} from '../../global-state/rootReducer';
import { getSeedState } from '../../global-state/seedState';
import { store } from '../../global-state/store';
import { ReducerRegistryContext, createReducerRegistry } from '../../global-state/storeContext';
import { RouteInfoProvider } from '../../global-state/useRouteInfo';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  CommonActions,
  StackActions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type Route,
} from '../routers';
import { DeprecatedNavigationInChildContext } from './DeprecatedNavigationInChildContext';
import { EnsureSingleNavigator } from './EnsureSingleNavigator';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationContainerRefContext } from './NavigationContainerRefContext';
import { NavigationIndependentTreeContext } from './NavigationIndependentTreeContext';
import { NavigationStateContext } from './NavigationStateContext';
import { checkDuplicateRouteNames } from './checkDuplicateRouteNames';
import { checkSerializable } from './checkSerializable';
import { NOT_INITIALIZED_ERROR } from './createNavigationContainerRef';
import { findFocusedRoute } from './findFocusedRoute';
import { ThemeProvider } from './theming/ThemeProvider';
import type {
  NavigationContainerEventMap,
  NavigationContainerProps,
  NavigationContainerRef,
} from './types';
import { useChildListeners } from './useChildListeners';
import { useEventEmitter } from './useEventEmitter';
import { useNavigationIndependentTree } from './useNavigationIndependentTree';
import { useOptionsGetters } from './useOptionsGetters';

type State = NavigationState | PartialState<NavigationState> | undefined;

const serializableWarnings: string[] = [];
const duplicateNameWarnings: string[] = [];

/**
 * Container component which holds the navigation state.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export function BaseNavigationContainer({
  ref,
  initialState,
  onStateChange,
  onReady,
  navigationInChildEnabled = false,
  theme,
  children,
}: NavigationContainerProps & { ref?: React.Ref<NavigationContainerRef<ParamListBase>> }) {
  const parent = use(NavigationStateContext);
  const independent = useNavigationIndependentTree();

  if (!parent.isDefault && !independent) {
    throw new Error(
      "Looks like you have nested a 'NavigationContainer' inside another. Normally you need only one container at the root of the app, so this was probably an error. If this was intentional, wrap the container in 'NavigationIndependentTree' explicitly. Note that this will make the child navigators disconnected from the parent and you won't be able to navigate between them."
    );
  }

  // Seed verbatim — no staling, no `getPartialState`. The app path (ExpoRoot) passes no
  // `initialState`: the store has already compiled the initial URL into a complete, keyed state
  // before anything mounts, so it is the seed. An explicit `initialState` (standalone / tests /
  // future persistence) still wins and is likewise seeded as-is. Navigators render their slice
  // directly (their init/rehydrate branches become identity on a complete state).
  // TODO(@ubax): re-add a state-seeding entry point for persistence (Step 8's validate-or-recompile model)
  const reducerRegistry = React.useMemo(() => createReducerRegistry(), []);

  // The navigation tree is React state at the root: `router.push` (and every other source) does
  // exactly one thing — dispatch an action — and all logic (href resolution, targeting, chaining,
  // the mount-window replay queue) happens inside the pure reducer, which React runs at render time.
  // This is what makes JS-initiated navigation a `startTransition`: reads flow from this value
  // through context, and a transition-wrapped dispatch lets React prepare the next screen in the
  // background without de-opting on an external-store mutation (the retired uSES render path).
  const rootReducerFn = React.useMemo(
    () => createRootNavigationReducer(reducerRegistry),
    [reducerRegistry]
  );
  const [rootNavigationState, rootDispatch] = React.useReducer(
    rootReducerFn,
    undefined,
    (): RootNavigationState => ({
      tree: (initialState == null ? getSeedState() : initialState) as NavigationState,
      pendingActions: [],
    })
  );

  const state = rootNavigationState.tree as State;

  // Commit-time mirror of the committed tree for imperative readers (`store.state` /
  // `navigationRef.getRootState()` / `getStateForHref` / sitemap / devtools). It is written from a
  // post-commit effect below, not at dispatch, so — unlike the retired sync store — it answers for
  // the last *committed* tree. During a pending transition it therefore lags the dispatch by a
  // commit (a `router.push(); router.canGoBack()` in one tick answers for the pre-push tree). Seed
  // it so a synchronous read before the first commit effect still returns the initial tree.
  const committedTreeRef = React.useRef<NavigationState>(rootNavigationState.tree);
  const getState = useLatestCallback(() => committedTreeRef.current as State);
  const getCommittedRootState = useLatestCallback(
    () => committedTreeRef.current as NavigationState | undefined
  );

  // Per-render resolver config for `ROUTER_LINK` reduction (D1): the current linking config +
  // redirects, threaded into every dispatch so a link resolves against the config as of this render
  // (Fast Refresh / route-file changes regenerate it — an init capture would misroute a push to a
  // route added after mount). `hasReducer` lets the divergence stop at the nearest mounted navigator.
  const resolveConfig = React.useMemo<ResolveNavigateConfig | undefined>(() => {
    const linking = store.linking;
    if (linking?.getStateFromPath == null) {
      return undefined;
    }
    return {
      getStateFromPath: linking.getStateFromPath,
      linkingConfig: linking.config,
      redirects: store.redirects,
      hasReducer: (key: string) => reducerRegistry.hasReducer(key),
    };
    // `store.linking`/`store.redirects` are module globals `useStore` repopulates each render; the
    // container re-renders when they change (the seed/route tree changed), so reading them in the
    // memo body with a render-scoped dep list is the render-updated source D1 requires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducerRegistry, store.linking, store.redirects]);

  const isFirstMountRef = React.useRef<boolean>(true);

  const navigatorKeyRef = React.useRef<string | undefined>(undefined);

  const getKey = React.useCallback(() => navigatorKeyRef.current, []);

  const setKey = React.useCallback((key: string) => {
    navigatorKeyRef.current = key;
  }, []);

  const { listeners, addListener } = useChildListeners();

  const emitter = useEventEmitter<NavigationContainerEventMap>();

  // Every write to the tree goes through here: a single `rootDispatch` of an envelope the pure
  // reducer reduces at render time. JS-initiated sources (the imperative API, `Link`, deep links)
  // arrive as non-urgent and are wrapped in `React.startTransition`, so the current screen stays
  // mounted while a suspending destination prepares; native-induced and mount-window replays pass
  // `urgent` and commit synchronously (D5). `dispatchRoot` no longer reads or reduces the tree
  // itself — the reducer does, against its own chained latest — and returns nothing (the verdict is
  // gone; imperative "would this do anything" queries call the pure reducer directly, see
  // `canGoBack`).
  const dispatchRoot = useLatestCallback(
    (
      action: NavigationAction,
      options: {
        originKey?: string;
        isReplay?: boolean;
        urgent?: boolean;
      } = {}
    ) => {
      const envelope = {
        action,
        originKey: options.originKey,
        isReplay: options.isReplay,
        urgent: options.urgent,
        config: resolveConfig,
      };

      if (options.urgent || options.isReplay) {
        rootDispatch(envelope);
      } else {
        React.startTransition(() => rootDispatch(envelope));
      }
    }
  );

  // Replay actions held during the mount window. The pure reducer appends an action it couldn't
  // reduce (origin navigator not yet registered) to `pendingActions`; this commit effect — which
  // runs after the registration effects — re-dispatches each urgently with `isReplay`, and the
  // reducer drains the entry whether it reduces or is now dropped (drop-after-one-retry).
  React.useEffect(() => {
    if (rootNavigationState.pendingActions.length === 0) {
      return;
    }

    for (const { action, originKey } of rootNavigationState.pendingActions) {
      dispatchRoot(action, { originKey, isReplay: true, urgent: true });
    }
  }, [rootNavigationState.pendingActions, dispatchRoot]);

  const getFocusedOriginKey = React.useCallback(
    (rootState: NavigationState | undefined) => {
      if (rootState == null) {
        return undefined;
      }

      return getDeepestFocusedRegisteredKey(rootState, reducerRegistry);
    },
    [reducerRegistry]
  );

  const dispatch = useLatestCallback(
    (action: NavigationAction | ((state: NavigationState) => NavigationAction)) => {
      const rootState = getCommittedRootState();

      if (rootState == null) {
        console.error(NOT_INITIALIZED_ERROR);
        return;
      }

      const nextAction = typeof action === 'function' ? action(rootState) : action;
      dispatchRoot(nextAction, { originKey: getFocusedOriginKey(rootState) });
    }
  );

  // "Would a GO_BACK / dismiss change anything?" — call the pure reducer against the last committed
  // tree and check by referential identity. A no-op returns the identical tree (guaranteed at every
  // nesting depth by `reduceRoot`), so `result.state !== rootState` is true iff the action would
  // actually pop. This answers for the committed tree: during a pending transition it reflects the
  // pre-transition state, by design (the imperative store no longer leads render).
  const canGoBack = useLatestCallback(() => {
    const rootState = getCommittedRootState();

    if (rootState == null) {
      return false;
    }

    return (
      rootReducer(rootState, CommonActions.goBack(), reducerRegistry, {
        originKey: getFocusedOriginKey(rootState),
      }).state !== rootState
    );
  });

  const canDismiss = useLatestCallback(() => {
    const rootState = getCommittedRootState();

    if (rootState == null) {
      return false;
    }

    return (
      rootReducer(rootState, StackActions.pop(1), reducerRegistry, {
        originKey: getFocusedOriginKey(rootState),
      }).state !== rootState
    );
  });

  const resetRoot = useLatestCallback((state?: PartialState<NavigationState> | NavigationState) => {
    // Always target the live root navigator, ignoring the incoming state's key. Compiled states
    // (from `getStateFromPath`) carry deterministic keys that never match the live-minted root key,
    // and `resetRoot` means "reset the root" — so the target is the root, not the state.
    const target = getCommittedRootState()?.key;

    if (target == null) {
      console.error(NOT_INITIALIZED_ERROR);
    } else {
      dispatchRoot({
        ...CommonActions.reset(state),
        target,
      });
    }
  });

  const getRootState = useLatestCallback(() => {
    return getCommittedRootState();
  });

  const getCurrentRoute = useLatestCallback(() => {
    const state = getRootState();

    if (state == null) {
      return undefined;
    }

    const route = findFocusedRoute(state);

    return route as Route<string> | undefined;
  });

  const isReady = useLatestCallback(() => listeners.focus[0] != null);

  const { addOptionsGetter, getCurrentOptions } = useOptionsGetters({});

  const navigation: NavigationContainerRef<ParamListBase> & {
    // Internal: lets the action builder learn which navigators are currently mounted so it can aim
    // an action at the nearest mounted navigator (the committed state may contain unmounted ones).
    hasReducer: (key: string) => boolean;
  } = React.useMemo(
    () => ({
      ...Object.keys(CommonActions).reduce<any>((acc, name) => {
        acc[name] = (...args: any[]) =>
          // @ts-expect-error: this is ok
          dispatch(CommonActions[name](...args));
        return acc;
      }, {}),
      ...emitter.create('root'),
      dispatch,
      resetRoot,
      isFocused: () => true,
      canGoBack,
      canDismiss,
      getParent: () => undefined,
      getState,
      getRootState,
      getCurrentRoute,
      getCurrentOptions,
      isReady,
      setOptions: () => {
        throw new Error('Cannot call setOptions outside a screen');
      },
      hasReducer: (key: string) => reducerRegistry.hasReducer(key),
    }),
    [
      canGoBack,
      canDismiss,
      dispatch,
      emitter,
      getCurrentOptions,
      getCurrentRoute,
      getRootState,
      getState,
      isReady,
      resetRoot,
      reducerRegistry,
    ]
  );

  React.useImperativeHandle(ref, () => navigation, [navigation]);

  const lastEmittedOptionsRef = React.useRef<object | undefined>(undefined);

  const onOptionsChange = useLatestCallback((options: object) => {
    if (lastEmittedOptionsRef.current === options) {
      return;
    }

    lastEmittedOptionsRef.current = options;

    emitter.emit({
      type: 'options',
      data: { options },
    });
  });

  const builderContext = React.useMemo(
    () => ({
      addListener,
      dispatchRoot,
      onOptionsChange,
    }),
    [addListener, dispatchRoot, onOptionsChange]
  );

  const isInitialRef = React.useRef(true);

  const getIsInitial = React.useCallback(() => isInitialRef.current, []);

  const context = React.useMemo(
    () => ({
      state,
      getState,
      getKey,
      setKey,
      getIsInitial,
      addOptionsGetter,
    }),
    [state, getState, getKey, setKey, getIsInitial, addOptionsGetter]
  );

  const onReadyRef = React.useRef(onReady);
  const onStateChangeRef = React.useRef(onStateChange);

  React.useEffect(() => {
    isInitialRef.current = false;
    onStateChangeRef.current = onStateChange;
    onReadyRef.current = onReady;
  });

  const onReadyCalledRef = React.useRef(false);

  // Runs after every commit rather than only on state change: a navigator can register after the
  // container has mounted (async / suspended content), flipping `isReady()` to `true` without any
  // accompanying state change. The `onReadyCalledRef` guard keeps this fire-once.
  React.useEffect(() => {
    if (!onReadyCalledRef.current && isReady()) {
      onReadyCalledRef.current = true;
      onReadyRef.current?.();
      emitter.emit({ type: 'ready' });
    }
  });

  // Publish the committed tree to the imperative mirror before any commit-time consumer reads it.
  // A layout effect runs before the passive `state` effect below (and before descendant layout
  // effects that might read `store.state`), so `getRootState()`/`store.state` reflect this commit
  // by the time `onStateChange`, the `'state'` emit, and route-info derivation run.
  React.useInsertionEffect(() => {
    committedTreeRef.current = rootNavigationState.tree;
  }, [rootNavigationState.tree]);

  React.useEffect(() => {
    const hydratedState = getRootState();

    if (process.env.NODE_ENV !== 'production') {
      if (hydratedState !== undefined) {
        const serializableResult = checkSerializable(hydratedState);

        if (!serializableResult.serializable) {
          const { location, reason } = serializableResult;

          let path = '';
          let pointer: Record<any, any> = hydratedState;
          let params = false;

          for (let i = 0; i < location.length; i++) {
            const curr = location[i]!;
            const prev = location[i - 1];

            pointer = pointer[curr];

            if (!params && curr === 'state') {
              continue;
            } else if (!params && curr === 'routes') {
              if (path) {
                path += ' > ';
              }
            } else if (!params && typeof curr === 'number' && prev === 'routes') {
              path += pointer?.name;
            } else if (!params) {
              path += ` > ${curr}`;
              params = true;
            } else {
              if (typeof curr === 'number' || /^[0-9]+$/.test(curr)) {
                path += `[${curr}]`;
              } else if (/^[a-z$_]+$/i.test(curr)) {
                path += `.${curr}`;
              } else {
                path += `[${JSON.stringify(curr)}]`;
              }
            }
          }

          const message = `Non-serializable values were found in the navigation state. Check:\n\n${path} (${reason})\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`;

          if (!serializableWarnings.includes(message)) {
            serializableWarnings.push(message);
            console.warn(message);
          }
        }

        const duplicateRouteNamesResult = checkDuplicateRouteNames(hydratedState);

        if (duplicateRouteNamesResult.length) {
          const message = `Found screens with the same name nested inside one another. Check:\n${duplicateRouteNamesResult.map(
            (locations) => `\n${locations.join(', ')}`
          )}\n\nThis can cause confusing behavior during navigation. Consider using unique names for each screen instead.`;

          if (!duplicateNameWarnings.includes(message)) {
            duplicateNameWarnings.push(message);
            console.warn(message);
          }
        }
      }
    }

    emitter.emit({ type: 'state', data: { state } });

    if (!isFirstMountRef.current && onStateChangeRef.current) {
      onStateChangeRef.current(hydratedState);
    }

    isFirstMountRef.current = false;
  }, [getRootState, emitter, state]);

  return (
    <NavigationIndependentTreeContext.Provider value={false}>
      <ReducerRegistryContext.Provider value={reducerRegistry}>
        <NavigationContainerRefContext.Provider value={navigation}>
          <NavigationBuilderContext.Provider value={builderContext}>
            <NavigationStateContext.Provider value={context}>
              <RouteInfoProvider state={state}>
                <DeprecatedNavigationInChildContext.Provider value={navigationInChildEnabled}>
                  <EnsureSingleNavigator>
                    <ThemeProvider value={theme}>{children}</ThemeProvider>
                  </EnsureSingleNavigator>
                </DeprecatedNavigationInChildContext.Provider>
              </RouteInfoProvider>
            </NavigationStateContext.Provider>
          </NavigationBuilderContext.Provider>
        </NavigationContainerRefContext.Provider>
      </ReducerRegistryContext.Provider>
    </NavigationIndependentTreeContext.Provider>
  );
}

function getDeepestFocusedRegisteredKey(
  state: NavigationState,
  reducerRegistry: ReturnType<typeof createReducerRegistry>
): string {
  let key = state.key;
  let currentState: NavigationState | undefined = state;

  while (currentState != null) {
    const route = currentState.routes[currentState.index];
    const childState = route?.state;

    if (
      childState == null ||
      childState.stale !== false ||
      !reducerRegistry.hasReducer(childState.key)
    ) {
      break;
    }

    key = childState.key;
    currentState = childState as NavigationState;
  }

  return key;
}
