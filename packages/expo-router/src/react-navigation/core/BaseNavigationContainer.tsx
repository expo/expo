import {
  CommonActions,
  type InitialState,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type Route,
} from '@react-navigation/routers';
import * as React from 'react';
import useLatestCallback from 'use-latest-callback';

import { checkDuplicateRouteNames } from './checkDuplicateRouteNames';
import { checkSerializable } from './checkSerializable';
import { NOT_INITIALIZED_ERROR } from './createNavigationContainerRef';
import { DeprecatedNavigationInChildContext } from './DeprecatedNavigationInChildContext';
import { EnsureSingleNavigator } from './EnsureSingleNavigator';
import { findFocusedRoute } from './findFocusedRoute';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationContainerRefContext } from './NavigationContainerRefContext';
import { NavigationIndependentTreeContext } from './NavigationIndependentTreeContext';
import { NavigationStateContext } from './NavigationStateContext';
import { ThemeProvider } from './theming/ThemeProvider';
import type {
  NavigationContainerEventMap,
  NavigationContainerProps,
  NavigationContainerRef,
} from './types';
import { UnhandledActionContext } from './UnhandledActionContext';
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
 * Remove `key` and `routeNames` from the state objects recursively to get partial state.
 *
 * @param state Initial state object.
 */
const getPartialState = (
  state: InitialState | undefined
): PartialState<NavigationState> | undefined => {
  if (state === undefined) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { key, routeNames, ...partialState } = state;

  return {
    ...partialState,
    stale: true,
    routes: state.routes.map((route) => {
      if (route.state === undefined) {
        return route as Route<string> & {
          state?: PartialState<NavigationState>;
        };
      }

      return { ...route, state: getPartialState(route.state) };
    }),
  };
};

/**
 * Container component which holds the navigation state.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree.
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled.
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export const BaseNavigationContainer = React.forwardRef(
  function BaseNavigationContainer(
    {
      initialState,
      onStateChange,
      onReady,
      onUnhandledAction,
      navigationInChildEnabled = false,
      theme,
      children,
    }: NavigationContainerProps,
    ref?: React.Ref<NavigationContainerRef<ParamListBase>>
  ) {
    const parent = React.useContext(NavigationStateContext);
    const independent = useNavigationIndependentTree();

    if (!parent.isDefault && !independent) {
      throw new Error(
        "Looks like you have nested a 'NavigationContainer' inside another. Normally you need only one container at the root of the app, so this was probably an error. If this was intentional, wrap the container in 'NavigationIndependentTree' explicitly. Note that this will make the child navigators disconnected from the parent and you won't be able to navigate between them."
      );
    }

    const { state, getState, setState, scheduleUpdate, flushUpdates } =
      useSyncState<State>(() =>
        getPartialState(initialState == null ? undefined : initialState)
      );

    const isFirstMountRef = React.useRef<boolean>(true);

    const navigatorKeyRef = React.useRef<string | undefined>(undefined);

    const getKey = React.useCallback(() => navigatorKeyRef.current, []);

    const setKey = React.useCallback((key: string) => {
      navigatorKeyRef.current = key;
    }, []);

    const { listeners, addListener } = useChildListeners();

    const { keyedListeners, addKeyedListener } = useKeyedChildListeners();

    const dispatch = useLatestCallback(
      (
        action:
          | NavigationAction
          | ((state: NavigationState) => NavigationAction)
      ) => {
        if (listeners.focus[0] == null) {
          console.error(NOT_INITIALIZED_ERROR);
        } else {
          listeners.focus[0]((navigation) => navigation.dispatch(action));
        }
      }
    );

    const canGoBack = useLatestCallback(() => {
      if (listeners.focus[0] == null) {
        return false;
      }

      const { result, handled } = listeners.focus[0]((navigation) =>
        navigation.canGoBack()
      );

      if (handled) {
        return result;
      } else {
        return false;
      }
    });

    const resetRoot = useLatestCallback(
      (state?: PartialState<NavigationState> | NavigationState) => {
        const target = state?.key ?? keyedListeners.getState.root?.().key;

        if (target == null) {
          console.error(NOT_INITIALIZED_ERROR);
        } else {
          listeners.focus[0]((navigation) =>
            navigation.dispatch({
              ...CommonActions.reset(state),
              target,
            })
          );
        }
      }
    );

    const getRootState = useLatestCallback(() => {
      return keyedListeners.getState.root?.();
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

    const emitter = useEventEmitter<NavigationContainerEventMap>();

    const { addOptionsGetter, getCurrentOptions } = useOptionsGetters({});

    const navigation: NavigationContainerRef<ParamListBase> = React.useMemo(
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
        getParent: () => undefined,
        getState,
        getRootState,
        getCurrentRoute,
        getCurrentOptions,
        isReady,
        setOptions: () => {
          throw new Error('Cannot call setOptions outside a screen');
        },
      }),
      [
        canGoBack,
        dispatch,
        emitter,
        getCurrentOptions,
        getCurrentRoute,
        getRootState,
        getState,
        isReady,
        resetRoot,
      ]
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    const onDispatchAction = useLatestCallback(
      (action: NavigationAction, noop: boolean) => {
        emitter.emit({
          type: '__unsafe_action__',
          data: { action, noop, stack: stackRef.current },
        });
      }
    );

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

    const stackRef = React.useRef<string | undefined>(undefined);

    const builderContext = React.useMemo(
      () => ({
        addListener,
        addKeyedListener,
        onDispatchAction,
        onOptionsChange,
        scheduleUpdate,
        flushUpdates,
        stackRef,
      }),
      [
        addListener,
        addKeyedListener,
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
      [
        state,
        getState,
        setState,
        getKey,
        setKey,
        getIsInitial,
        addOptionsGetter,
      ]
    );

    const onReadyRef = React.useRef(onReady);
    const onStateChangeRef = React.useRef(onStateChange);

    React.useEffect(() => {
      isInitialRef.current = false;
      onStateChangeRef.current = onStateChange;
      onReadyRef.current = onReady;
    });

    const onReadyCalledRef = React.useRef(false);

    React.useEffect(() => {
      if (!onReadyCalledRef.current && isReady()) {
        onReadyCalledRef.current = true;
        onReadyRef.current?.();
        emitter.emit({ type: 'ready' });
      }
    }, [state, isReady, emitter]);

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
              const curr = location[i];
              const prev = location[i - 1];

              pointer = pointer[curr];

              if (!params && curr === 'state') {
                continue;
              } else if (!params && curr === 'routes') {
                if (path) {
                  path += ' > ';
                }
              } else if (
                !params &&
                typeof curr === 'number' &&
                prev === 'routes'
              ) {
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

          const duplicateRouteNamesResult =
            checkDuplicateRouteNames(hydratedState);

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

    const defaultOnUnhandledAction = useLatestCallback(
      (action: NavigationAction) => {
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
      }
    );

    return (
      <NavigationIndependentTreeContext.Provider value={false}>
        <NavigationContainerRefContext.Provider value={navigation}>
          <NavigationBuilderContext.Provider value={builderContext}>
            <NavigationStateContext.Provider value={context}>
              <UnhandledActionContext.Provider
                value={onUnhandledAction ?? defaultOnUnhandledAction}
              >
                <DeprecatedNavigationInChildContext.Provider
                  value={navigationInChildEnabled}
                >
                  <EnsureSingleNavigator>
                    <ThemeProvider value={theme}>{children}</ThemeProvider>
                  </EnsureSingleNavigator>
                </DeprecatedNavigationInChildContext.Provider>
              </UnhandledActionContext.Provider>
            </NavigationStateContext.Provider>
          </NavigationBuilderContext.Provider>
        </NavigationContainerRefContext.Provider>
      </NavigationIndependentTreeContext.Provider>
    );
  }
);
