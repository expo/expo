'use client';
import * as React from 'react';
import { use } from 'react';

import { rootReducer } from '../../global-state/rootReducer';
import { getSeedState } from '../../global-state/seedState';
import {
  NavigationSyncStateContext,
  ReducerRegistryContext,
  createReducerRegistry,
} from '../../global-state/storeContext';
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
import { UnhandledActionContext } from './UnhandledActionContext';
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
import { useKeyedChildListeners } from './useKeyedChildListeners';
import { useNavigationIndependentTree } from './useNavigationIndependentTree';
import { useOptionsGetters } from './useOptionsGetters';
import { useSyncState } from './useSyncState';

type State = NavigationState | PartialState<NavigationState> | undefined;

const serializableWarnings: string[] = [];
const duplicateNameWarnings: string[] = [];

/**
 * Container component which holds the navigation state.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled.
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export function BaseNavigationContainer({
  ref,
  initialState,
  onStateChange,
  onReady,
  onUnhandledAction,
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
  const { state, store, getState, setState, scheduleUpdate, flushUpdates } = useSyncState<State>(
    () => (initialState == null ? getSeedState() : initialState) as State
  );
  const reducerRegistry = React.useMemo(() => createReducerRegistry(), []);

  const isFirstMountRef = React.useRef<boolean>(true);

  const navigatorKeyRef = React.useRef<string | undefined>(undefined);

  const getKey = React.useCallback(() => navigatorKeyRef.current, []);

  const setKey = React.useCallback((key: string) => {
    navigatorKeyRef.current = key;
  }, []);

  const { listeners, addListener } = useChildListeners();

  const { addKeyedListener } = useKeyedChildListeners();

  const emitter = useEventEmitter<NavigationContainerEventMap>();

  const stackRef = React.useRef<string | undefined>(undefined);

  const onDispatchAction = useLatestCallback((action: NavigationAction, noop: boolean) => {
    emitter.emit({
      type: '__unsafe_action__',
      data: { action, noop, stack: stackRef.current },
    });
  });

  const defaultOnUnhandledAction = useLatestCallback((action: NavigationAction) => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const payload: Record<string, any> | undefined = action.payload;

    let message = `The action '${action.type}'${
      payload ? ` with payload ${JSON.stringify(action.payload)}` : ''
    } was not handled by any navigator.`;

    switch (action.type) {
      case 'PRELOAD':
      case 'NAVIGATE':
      case 'PUSH':
      case 'REPLACE':
      case 'POP_TO':
      case 'JUMP_TO':
        if (payload?.name) {
          message += `\n\nDo you have a screen named '${payload.name}'?\n\nIf you're trying to navigate to a screen in a nested navigator, see https://reactnavigation.org/docs/nesting-navigators#navigating-to-a-screen-in-a-nested-navigator.\n\nIf you're using conditional rendering, navigation will happen automatically and you shouldn't navigate manually, see.`;
        } else {
          message += `\n\nYou need to pass the name of the screen to navigate to.\n\nSee https://reactnavigation.org/docs/navigation-actions for usage.`;
        }

        break;
      case 'GO_BACK':
      case 'POP':
      case 'POP_TO_TOP':
        message += `\n\nIs there any screen to go back to?`;
        break;
      case 'OPEN_DRAWER':
      case 'CLOSE_DRAWER':
      case 'TOGGLE_DRAWER':
        message += `\n\nIs your screen inside a Drawer navigator?`;
        break;
    }

    message += `\n\nThis is a development-only warning and won't be shown in production.`;

    console.error(message);
  });

  // The committed sync store is the single source of truth for every imperative read and dispatch.
  // Navigators reduce into it through `dispatchRoot` and read their slice back out of it; the
  // registry (`hasReducer`) supplies the orthogonal "which navigators are mounted" signal, so there
  // is no separate compose-up getter chain.
  const getCommittedRootState = useLatestCallback(() => getState() as NavigationState | undefined);

  // Actions dispatched before their origin navigator's reducer has registered. This is the mount
  // window: a descendant's mount effect can dispatch (e.g. an untargeted `navigate` or a `preload`)
  // before its ancestor navigators' registration effects run. Rather than reducing locally, we hold
  // the action and replay it through the root reducer after the next commit, once registration lands.
  const pendingReplayRef = React.useRef<{ action: NavigationAction; originKey?: string }[]>([]);
  const [replayTick, requestReplay] = React.useReducer((tick: number) => tick + 1, 0);

  const dispatchRoot = useLatestCallback(
    (
      action: NavigationAction,
      options: {
        originKey?: string;
        suppressUnhandled?: boolean;
        skipBeforeRemove?: boolean;
        isReplay?: boolean;
      } = {}
    ) => {
      const rootState = getCommittedRootState();

      if (rootState == null) {
        console.error(NOT_INITIALIZED_ERROR);
        return false;
      }

      const result = rootReducer(rootState, action, reducerRegistry, options);

      if (!result.handled) {
        const originUnregistered =
          options.originKey != null && !reducerRegistry.hasReducer(options.originKey);
        const isDeferrable = action.type === 'PRELOAD' || action.target == null;

        if (originUnregistered && isDeferrable && !options.suppressUnhandled && !options.isReplay) {
          // Mount window: the origin navigator exists in the committed tree but hasn't registered
          // its reducer yet. Hold the action and replay it after the next commit (see below). If it
          // is still unhandled on replay, it falls through to the unhandled reporting.
          pendingReplayRef.current.push({ action, originKey: options.originKey });
          requestReplay();
          return false;
        }

        const originEntry =
          options.originKey == null ? undefined : reducerRegistry.getEntry(options.originKey);

        if (options.suppressUnhandled) {
          return false;
        }

        if (originEntry?.onUnhandledAction != null) {
          originEntry.onUnhandledAction(action);
        } else {
          (onUnhandledAction ?? defaultOnUnhandledAction)(action);
        }
        return false;
      }

      onDispatchAction(action, result.noop);

      if (!result.noop) {
        const isPrevented = result.changedSlices
          .slice()
          .sort((a, b) => {
            return getStateDepth(result.state, b.key) - getStateDepth(result.state, a.key);
          })
          .some(
            (slice) =>
              !options.skipBeforeRemove &&
              slice.entry.shouldPreventRemove?.(slice.previousState, slice.nextState, action)
          );

        if (isPrevented) {
          return true;
        }

        setState(result.state);
      }

      return true;
    }
  );

  // Replay actions held during the mount window. Runs on every commit (and whenever `requestReplay`
  // fires), which for the initial mount lands after the descendant navigators' registration effects,
  // so the root reducer now sees the origin registered. `isReplay` stops a still-unhandled replay
  // from re-queuing, bounding this to a single retry.
  React.useEffect(() => {
    if (pendingReplayRef.current.length === 0) {
      return;
    }

    const pending = pendingReplayRef.current;
    pendingReplayRef.current = [];

    for (const { action, originKey } of pending) {
      dispatchRoot(action, { originKey, isReplay: true });
    }
  }, [replayTick, dispatchRoot]);

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

  const canGoBack = useLatestCallback(() => {
    const rootState = getCommittedRootState();

    if (rootState == null) {
      return false;
    }

    const result = rootReducer(rootState, CommonActions.goBack(), reducerRegistry, {
      originKey: getFocusedOriginKey(rootState),
    });

    return result.handled && !result.noop;
  });

  const canDismiss = useLatestCallback(() => {
    const rootState = getCommittedRootState();

    if (rootState == null) {
      return false;
    }

    const result = rootReducer(rootState, StackActions.pop(1), reducerRegistry, {
      originKey: getFocusedOriginKey(rootState),
    });

    return result.handled && !result.noop;
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
      addKeyedListener,
      dispatchRoot,
      onDispatchAction,
      onOptionsChange,
      scheduleUpdate,
      flushUpdates,
      stackRef,
    }),
    [
      addListener,
      addKeyedListener,
      dispatchRoot,
      onDispatchAction,
      onOptionsChange,
      scheduleUpdate,
      flushUpdates,
    ]
  );

  const isInitialRef = React.useRef(true);

  const getIsInitial = React.useCallback(() => isInitialRef.current, []);

  const context = React.useMemo(
    () => ({
      state,
      getState,
      setState,
      getKey,
      setKey,
      getIsInitial,
      addOptionsGetter,
    }),
    [state, getState, setState, getKey, setKey, getIsInitial, addOptionsGetter]
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
      <NavigationSyncStateContext.Provider value={store}>
        <ReducerRegistryContext.Provider value={reducerRegistry}>
          <NavigationContainerRefContext.Provider value={navigation}>
            <NavigationBuilderContext.Provider value={builderContext}>
              <NavigationStateContext.Provider value={context}>
                <UnhandledActionContext.Provider
                  value={onUnhandledAction ?? defaultOnUnhandledAction}>
                  <DeprecatedNavigationInChildContext.Provider value={navigationInChildEnabled}>
                    <EnsureSingleNavigator>
                      <ThemeProvider value={theme}>{children}</ThemeProvider>
                    </EnsureSingleNavigator>
                  </DeprecatedNavigationInChildContext.Provider>
                </UnhandledActionContext.Provider>
              </NavigationStateContext.Provider>
            </NavigationBuilderContext.Provider>
          </NavigationContainerRefContext.Provider>
        </ReducerRegistryContext.Provider>
      </NavigationSyncStateContext.Provider>
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

function getStateDepth(state: NavigationState, key: string, depth = 0): number {
  if (state.key === key) {
    return depth;
  }

  for (const route of state.routes) {
    const childState = route.state;

    if (childState != null && childState.stale === false) {
      const childDepth = getStateDepth(childState as NavigationState, key, depth + 1);

      if (childDepth !== -1) {
        return childDepth;
      }
    }
  }

  return -1;
}
