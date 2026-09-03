'use client';
import * as React from 'react';
import { use } from 'react';

import type { RouteNode } from '../../Route';
import { findFocusedRoute } from '../../fork/findFocusedRoute';
import { RoutingQueueDrainer } from '../../global-state/RoutingQueueDrainer';
import {
  areUrlObjectsEqual,
  getRouteInfoFromState,
} from '../../global-state/getRouteInfoFromState';
import { GlobalRoutesWithRemovalPreventedContext } from '../../global-state/removalPrevention';
import { RouteInfoContext } from '../../global-state/routeInfoContext';
import { RouterConfigContext } from '../../global-state/routerConfigContext';
import { RouterRegistryContext } from '../../global-state/routerRegistry';
import { RoutingQueueApiContext } from '../../global-state/routingQueueContext';
import { useNavigationTreeReducer } from '../../global-state/useNavigationTreeReducer';
import { useNavigationTreeReportEvents } from '../../global-state/useNavigationTreeReportEvents';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  CommonActions,
  type InitialState,
  type NavigationAction,
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
 * @param props.onUnhandledAction Callback which is called when an action is not handled. TODO(@ubax): restore this callback. https://linear.app/expo/issue/ENG-26123
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export function BaseNavigationContainer(props: InternalNavigationContainerProps) {
  const { ref, initialState, onReady, UNSTABLE_routeNode, theme, children } = props;
  const parent = use(NavigationStateContext);
  const inheritedRouteInfo = use(RouteInfoContext);
  const routerConfig = use(RouterConfigContext);
  const routingQueue = use(RoutingQueueApiContext);
  const registry = use(RouterRegistryContext);
  const routesWithRemovalPrevented = use(GlobalRoutesWithRemovalPreventedContext);

  if (!parent.isDefault) {
    throw new Error(
      "Looks like you have nested a 'NavigationContainer' inside another. Normally you need only one container at the root of the app, so this was probably an error. If you need to render an isolated navigation tree inside a screen, install '@react-navigation/native' and use its NavigationContainer instead."
    );
  }

  if (
    routingQueue === undefined ||
    registry === undefined ||
    routesWithRemovalPrevented === undefined
  ) {
    throw new Error(
      'The navigation container requires the shared routing state provided by `ExpoRoot`. Render the navigation container inside `ExpoRoot`.'
    );
  }

  const emitter = useEventEmitter<NavigationContainerEventMap>();

  // TODO(@ubax): consider moving this state to ExpoRoot.
  const { state, report, consumeReportEvents, resetNavigator, handleAction, processIntent } =
    useNavigationTreeReducer({
      initialState,
      routeNode: UNSTABLE_routeNode,
      registry,
      routesWithRemovalPrevented,
      linking: routerConfig?.linking,
      redirects: routerConfig?.redirects,
    });
  useNavigationTreeReportEvents(report, consumeReportEvents);

  const { listeners, addListener } = useChildListeners();

  const dispatch = useLatestCallback((action: NavigationAction) => {
    if (listeners.focus[0] == null) {
      console.error(NOT_INITIALIZED_ERROR);
    } else {
      listeners.focus[0]((navigation) => navigation.dispatch(action));
    }
  });

  const dispatchSync = useLatestCallback((action: NavigationAction) => {
    // TODO(@ubax): Throw if this is called from a `removePrevented` callback.
    // TODO(@ubax): Review urgent dispatches interleaved with pending navigation transitions. React
    // rebases the queued actions, but intermediate state can reflect only the urgent action.
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

  const builderContext = React.useMemo(
    () => ({
      addListener,
      handleAction,
      resetNavigator,
    }),
    [addListener, handleAction, resetNavigator]
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

  const onReadyCalledRef = React.useRef(false);
  const notifyReady = React.useEffectEvent(() => onReady?.());

  React.useEffect(() => {
    if (!onReadyCalledRef.current && isReady()) {
      onReadyCalledRef.current = true;
      notifyReady();
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
    emitter.emit({ type: 'state', data: { state } });
  }, [emitter, state]);

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
