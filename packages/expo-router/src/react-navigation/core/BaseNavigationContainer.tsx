'use client';
import isEqual from 'fast-deep-equal';
import * as React from 'react';
import { use } from 'react';

import type { RouteNode } from '../../Route';
import { findFocusedRoute } from '../../fork/findFocusedRoute';
import { RoutingQueueDrainer } from '../../global-state/RoutingQueueDrainer';
import {
  areUrlObjectsEqual,
  getRouteInfoFromState,
} from '../../global-state/getRouteInfoFromState';
import { RouteInfoContext } from '../../global-state/routeInfoContext';
import { RouterConfigContext } from '../../global-state/routerConfigContext';
import { RouterRegistryContext, RouterRegistryProvider } from '../../global-state/routerRegistry';
import { useNavigationTreeReducer } from '../../global-state/useNavigationTreeReducer';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  CommonActions,
  type InitialState,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Route,
} from '../routers';
import { EnsureSingleNavigator } from './EnsureSingleNavigator';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationContainerRefContext } from './NavigationContainerRefContext';
import { NavigationStateContext } from './NavigationStateContext';
import { RootNavigationStateContext } from './RootNavigationStateContext';
import { checkDuplicateRouteNames } from './checkDuplicateRouteNames';
import { checkSerializable } from './checkSerializable';
import { NOT_INITIALIZED_ERROR } from './createNavigationContainerRef';
import { ThemeProvider } from './theming/ThemeProvider';
import type {
  NavigationContainerEventMap,
  NavigationContainerProps,
  NavigationContainerRef,
} from './types';
import { useChildListeners } from './useChildListeners';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useEventEmitter } from './useEventEmitter';
import { useKeyedChildListeners } from './useKeyedChildListeners';
import { useOptionsGetters } from './useOptionsGetters';

type InternalNavigationContainerProps = Omit<NavigationContainerProps, 'initialState'> & {
  initialState: InitialState;
  ref?: React.Ref<NavigationContainerRef<ParamListBase>>;
  UNSTABLE_routeNode?: RouteNode;
};

const serializableWarnings: string[] = [];
const duplicateNameWarnings: string[] = [];

/**
 * Container component which holds the navigation state.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree.
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled. TODO(@ubax): restore this callback. https://linear.app/expo/issue/ENG-26123
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export function BaseNavigationContainer(props: InternalNavigationContainerProps) {
  const registry = use(RouterRegistryContext);

  // TODO(@ubax): investigate if this is really needed
  if (registry === undefined) {
    return (
      <RouterRegistryProvider>
        <BaseNavigationContainerInner {...props} />
      </RouterRegistryProvider>
    );
  }

  return <BaseNavigationContainerInner {...props} />;
}

function BaseNavigationContainerInner({
  ref,
  initialState,
  onStateChange,
  onReady,
  UNSTABLE_routeNode,
  theme,
  children,
}: InternalNavigationContainerProps) {
  const parent = use(NavigationStateContext);
  const inheritedRouteInfo = use(RouteInfoContext);
  const routerConfig = use(RouterConfigContext);

  if (!parent.isDefault) {
    throw new Error(
      "Looks like you have nested a 'NavigationContainer' inside another. Normally you need only one container at the root of the app, so this was probably an error. If you need to render an isolated navigation tree inside a screen, install '@react-navigation/native' and use its NavigationContainer instead."
    );
  }

  const registry = use(RouterRegistryContext)!;
  const emitter = useEventEmitter<NavigationContainerEventMap>();
  // TODO(@ubax): invoke this callback from global reducer dispatches.
  // https://linear.app/expo/issue/ENG-26123
  const onDispatchAction = useLatestCallback((action: NavigationAction, noop: boolean) => {
    // TODO(@ubax): Capture dispatch stack traces in the expo-router devtools plugin. https://linear.app/expo/issue/ENG-20826
    emitter.emit({
      type: '__unsafe_action__',
      data: { action, noop },
    });
  });

  // TODO(@ubax): consider moving this state to ExpoRoot.
  const { state, resetNavigator, handleAction, processIntent } = useNavigationTreeReducer({
    initialState,
    routeNode: UNSTABLE_routeNode,
    registry,
    linking: routerConfig?.linking,
    redirects: routerConfig?.redirects,
  });

  const hasNotifiedInitialStateRef = React.useRef(false);
  const lastNotifiedStateRef = React.useRef<NavigationState | undefined>(undefined);

  const { listeners, addListener } = useChildListeners();

  const { addKeyedListener } = useKeyedChildListeners();

  const dispatch = useLatestCallback((action: NavigationAction) => {
    if (listeners.focus[0] == null) {
      console.error(NOT_INITIALIZED_ERROR);
    } else {
      listeners.focus[0]((navigation) => navigation.dispatch(action));
    }
  });

  const dispatchSync = useLatestCallback((action: NavigationAction) => {
    handleAction(action);
  });

  const canGoBack = useLatestCallback(() => {
    if (listeners.focus[0] == null) {
      return false;
    }

    const { result, handled } = listeners.focus[0]((navigation) => navigation.canGoBack());

    if (handled) {
      return result;
    } else {
      return false;
    }
  });

  const getRootState = useLatestCallback(() => state);

  const getCurrentRoute = useLatestCallback(() => {
    const state = getRootState();

    if (state == null) {
      return undefined;
    }

    const route = findFocusedRoute(state);

    return route as Route<string> | undefined;
  });

  // TODO(@ubax): check if this is still needed anywhere
  const isReady = useLatestCallback(() => listeners.focus[0] != null && registry.has(state.key));

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
      dispatchSync,
      isFocused: () => true,
      canGoBack,
      getParent: () => undefined,
      getState: getRootState,
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
      dispatchSync,
      emitter,
      getCurrentOptions,
      getCurrentRoute,
      getRootState,
      isReady,
    ]
  );

  React.useImperativeHandle(ref, () => navigation, [navigation]);

  const lastEmittedOptionsRef = React.useRef<
    { options: object; routeKey: string | undefined } | undefined
  >(undefined);

  // TODO(@ubax): investigate if there is better way to implemnet this and wether this is really needed,
  const onOptionsChange = useLatestCallback((options: object, routeKey?: string) => {
    const lastEmittedOptions = lastEmittedOptionsRef.current;
    if (
      lastEmittedOptions?.routeKey === routeKey &&
      lastEmittedOptions !== undefined &&
      isEqual(lastEmittedOptions.options, options)
    ) {
      return;
    }

    lastEmittedOptionsRef.current = { options, routeKey };

    emitter.emit({
      type: 'options',
      data: { options },
    });
  });

  const builderContext = React.useMemo(
    () => ({
      addListener,
      addKeyedListener,
      handleAction,
      resetNavigator,
      onDispatchAction,
      onOptionsChange,
    }),
    [addListener, addKeyedListener, handleAction, onDispatchAction, onOptionsChange, resetNavigator]
  );

  const context = React.useMemo(
    () => ({
      state,
      addOptionsGetter,
    }),
    [state, addOptionsGetter]
  );
  const nextRouteInfo = React.useMemo(
    () => (UNSTABLE_routeNode ? getRouteInfoFromState(state) : inheritedRouteInfo),
    [state, UNSTABLE_routeNode, inheritedRouteInfo]
  );
  const [routeInfo, setRouteInfo] = React.useState(nextRouteInfo);
  // React retries this component before rendering its children, preserving context identity when
  // the derived route info is unchanged. https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (!areUrlObjectsEqual(routeInfo, nextRouteInfo)) {
    setRouteInfo(nextRouteInfo);
  }

  const onReadyRef = React.useRef(onReady);
  const onStateChangeRef = React.useRef(onStateChange);

  React.useEffect(() => {
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
  }, [state, registry, isReady, emitter]);

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
  }, [getRootState, state]);

  useClientLayoutEffect(() => {
    const hydratedState = getRootState();

    // TODO(@ubax): invesitagte if there is cleaner way to do it
    // If not consider deprecating the prop
    const onStateChange = onStateChangeRef.current;
    const shouldNotifyStateChange =
      hasNotifiedInitialStateRef.current &&
      lastNotifiedStateRef.current !== hydratedState &&
      onStateChange !== undefined;
    hasNotifiedInitialStateRef.current = true;
    lastNotifiedStateRef.current = hydratedState;

    emitter.emit({ type: 'state', data: { state } });

    if (shouldNotifyStateChange) {
      onStateChange(hydratedState);
    }
  }, [getRootState, emitter, state]);

  return (
    <NavigationContainerRefContext.Provider value={navigation}>
      <NavigationBuilderContext.Provider value={builderContext}>
        <NavigationStateContext.Provider value={context}>
          <RouteInfoContext.Provider value={routeInfo}>
            <RootNavigationStateContext.Provider value={state}>
              <EnsureSingleNavigator>
                <ThemeProvider value={theme}>{children}</ThemeProvider>
              </EnsureSingleNavigator>
              <RoutingQueueDrainer ready={registry.has(state.key)} processIntent={processIntent} />
            </RootNavigationStateContext.Provider>
          </RouteInfoContext.Provider>
        </NavigationStateContext.Provider>
      </NavigationBuilderContext.Provider>
    </NavigationContainerRefContext.Provider>
  );
}
