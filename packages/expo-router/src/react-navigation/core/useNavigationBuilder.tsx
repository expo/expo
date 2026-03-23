import {
  CommonActions,
  type DefaultRouterOptions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type Route,
  type Router,
  type RouterConfigOptions,
  type RouterFactory,
} from '@react-navigation/routers';
import deepEqual from 'fast-deep-equal';
import * as React from 'react';
import { isValidElementType } from 'react-is';
import useLatestCallback from 'use-latest-callback';

import { deepFreeze } from './deepFreeze';
import { Group } from './Group';
import { isArrayEqual } from './isArrayEqual';
import { isRecordEqual } from './isRecordEqual';
import { NavigationHelpersContext } from './NavigationHelpersContext';
import { NavigationMetaContext } from './NavigationMetaContext';
import { NavigationRouteContext } from './NavigationProvider';
import { NavigationStateContext } from './NavigationStateContext';
import { PreventRemoveProvider } from './PreventRemoveProvider';
import { Screen } from './Screen';
import {
  type DefaultNavigatorOptions,
  type EventMapBase,
  type EventMapCore,
  type NavigatorScreenParams,
  PrivateValueStore,
  type RouteConfig,
} from './types';
import { UnhandledActionContext } from './UnhandledActionContext';
import { useChildListeners } from './useChildListeners';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useComponent } from './useComponent';
import { useCurrentRender } from './useCurrentRender';
import { type ScreenConfigWithParent, useDescriptors } from './useDescriptors';
import { useEventEmitter } from './useEventEmitter';
import { useFocusedListenersChildrenAdapter } from './useFocusedListenersChildrenAdapter';
import { useFocusEvents } from './useFocusEvents';
import { FocusedRouteKeyContext } from './useIsFocused';
import { useKeyedChildListeners } from './useKeyedChildListeners';
import { useLazyValue } from './useLazyValue';
import { useNavigationHelpers } from './useNavigationHelpers';
import { NavigationStateListenerProvider } from './useNavigationState';
import { useOnAction } from './useOnAction';
import { useOnGetState } from './useOnGetState';
import { useOnRouteFocus } from './useOnRouteFocus';
import { useRegisterNavigator } from './useRegisterNavigator';
import { useScheduleUpdate } from './useScheduleUpdate';

// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;

type NavigatorRoute = {
  key: string;
  params?: NavigatorScreenParams<ParamListBase>;
};

const CONSUMED_PARAMS = Symbol('CONSUMED_PARAMS');

const isScreen = (
  child: React.ReactElement<unknown>
): child is React.ReactElement<{
  name?: unknown;
  navigationKey?: unknown;
}> => {
  return child.type === Screen;
};

const isGroup = (
  child: React.ReactElement<unknown>
): child is React.ReactElement<{
  navigationKey?: unknown;
  screenOptions?: unknown;
  screenLayout?: unknown;
  children?: unknown;
}> => {
  return child.type === React.Fragment || child.type === Group;
};

const isValidKey = (key: unknown): key is string | undefined =>
  key === undefined || (typeof key === 'string' && key !== '');

/**
 * Extract route config object from React children elements.
 *
 * @param children React Elements to extract the config from.
 */
const getRouteConfigsFromChildren = <
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
>(
  children: React.ReactNode,
  groupKey?: string,
  groupOptions?: ScreenConfigWithParent<
    State,
    ScreenOptions,
    EventMap
  >['options'],
  groupLayout?: ScreenConfigWithParent<State, ScreenOptions, EventMap>['layout']
) => {
  const configs = React.Children.toArray(children).reduce<
    ScreenConfigWithParent<State, ScreenOptions, EventMap>[]
  >((acc, child) => {
    if (React.isValidElement(child)) {
      if (isScreen(child)) {
        // We can only extract the config from `Screen` elements
        // If something else was rendered, it's probably a bug

        if (typeof child.props !== 'object' || child.props === null) {
          throw new Error(`Got an invalid element for screen.`);
        }

        if (typeof child.props.name !== 'string' || child.props.name === '') {
          throw new Error(
            `Got an invalid name (${JSON.stringify(
              child.props.name
            )}) for the screen. It must be a non-empty string.`
          );
        }

        if (
          child.props.navigationKey !== undefined &&
          (typeof child.props.navigationKey !== 'string' ||
            child.props.navigationKey === '')
        ) {
          throw new Error(
            `Got an invalid 'navigationKey' prop (${JSON.stringify(
              child.props.navigationKey
            )}) for the screen '${
              child.props.name
            }'. It must be a non-empty string or 'undefined'.`
          );
        }

        acc.push({
          keys: [groupKey, child.props.navigationKey],
          options: groupOptions,
          layout: groupLayout,
          props: child.props as RouteConfig<
            ParamListBase,
            string,
            State,
            ScreenOptions,
            EventMap,
            unknown
          >,
        });

        return acc;
      }

      if (isGroup(child)) {
        if (!isValidKey(child.props.navigationKey)) {
          throw new Error(
            `Got an invalid 'navigationKey' prop (${JSON.stringify(
              child.props.navigationKey
            )}) for the group. It must be a non-empty string or 'undefined'.`
          );
        }

        // When we encounter a fragment or group, we need to dive into its children to extract the configs
        // This is handy to conditionally define a group of screens
        acc.push(
          ...getRouteConfigsFromChildren<State, ScreenOptions, EventMap>(
            child.props.children as React.ReactNode,
            child.props.navigationKey,
            // FIXME
            // @ts-expect-error: add validation
            child.type !== Group
              ? groupOptions
              : groupOptions != null
                ? [...groupOptions, child.props.screenOptions]
                : [child.props.screenOptions],
            typeof child.props.screenLayout === 'function'
              ? child.props.screenLayout
              : groupLayout
          )
        );

        return acc;
      }
    }

    throw new Error(
      `A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found ${
        React.isValidElement(child)
          ? `'${
              typeof child.type === 'string' ? child.type : child.type?.name
            }'${
              child.props != null &&
              typeof child.props === 'object' &&
              'name' in child.props &&
              child.props?.name
                ? ` for the screen '${child.props.name}'`
                : ''
            }`
          : typeof child === 'object'
            ? JSON.stringify(child)
            : `'${String(child)}'`
      }). To render this component in the navigator, pass it in the 'component' prop to 'Screen'.`
    );
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    configs.forEach((config) => {
      const { name, children, component, getComponent } = config.props;

      if (
        children != null ||
        component !== undefined ||
        getComponent !== undefined
      ) {
        if (children != null && component !== undefined) {
          throw new Error(
            `Got both 'component' and 'children' props for the screen '${name}'. You must pass only one of them.`
          );
        }

        if (children != null && getComponent !== undefined) {
          throw new Error(
            `Got both 'getComponent' and 'children' props for the screen '${name}'. You must pass only one of them.`
          );
        }

        if (component !== undefined && getComponent !== undefined) {
          throw new Error(
            `Got both 'component' and 'getComponent' props for the screen '${name}'. You must pass only one of them.`
          );
        }

        if (children != null && typeof children !== 'function') {
          throw new Error(
            `Got an invalid value for 'children' prop for the screen '${name}'. It must be a function returning a React Element.`
          );
        }

        if (component !== undefined && !isValidElementType(component)) {
          throw new Error(
            `Got an invalid value for 'component' prop for the screen '${name}'. It must be a valid React Component.`
          );
        }

        if (getComponent !== undefined && typeof getComponent !== 'function') {
          throw new Error(
            `Got an invalid value for 'getComponent' prop for the screen '${name}'. It must be a function returning a React Component.`
          );
        }

        if (typeof component === 'function') {
          if (component.name === 'component') {
            // Inline anonymous functions passed in the `component` prop will have the name of the prop
            // It's relatively safe to assume that it's not a component since it should also have PascalCase name
            // We won't catch all scenarios here, but this should catch a good chunk of incorrect use.
            console.warn(
              `Looks like you're passing an inline function for 'component' prop for the screen '${name}' (e.g. component={() => <SomeComponent />}). Passing an inline function will cause the component state to be lost on re-render and cause perf issues since it's re-created every render. You can pass the function as children to 'Screen' instead to achieve the desired behaviour.`
            );
          } else if (/^[a-z]/.test(component.name)) {
            console.warn(
              `Got a component with the name '${component.name}' for the screen '${name}'. React Components must start with an uppercase letter. If you're passing a regular function and not a component, pass it as children to 'Screen' instead. Otherwise capitalize your component's name.`
            );
          }
        }
      } else {
        throw new Error(
          `Couldn't find a 'component', 'getComponent' or 'children' prop for the screen '${name}'. This can happen if you passed 'undefined'. You likely forgot to export your component from the file it's defined in, or mixed up default import and named import when importing.`
        );
      }
    });
  }

  return configs;
};

const getStateFromParams = (params: NavigatorRoute['params']) => {
  if (params?.state != null) {
    return params.state;
  } else if (typeof params?.screen === 'string' && params?.initial !== false) {
    return {
      routes: [
        {
          name: params.screen,
          params: params.params,
          path: params.path,
        },
      ],
    };
  }

  return undefined;
};

/**
 * Hook for building navigators.
 *
 * @param createRouter Factory method which returns router object.
 * @param options Options object containing `children` and additional options for the router.
 * @returns An object containing `state`, `navigation`, `descriptors` objects.
 */
export function useNavigationBuilder<
  State extends NavigationState,
  RouterOptions extends DefaultRouterOptions,
  ActionHelpers extends Record<string, (...args: any) => void>,
  ScreenOptions extends {},
  EventMap extends Record<string, any>,
>(
  createRouter: RouterFactory<State, NavigationAction, RouterOptions>,
  options: DefaultNavigatorOptions<
    ParamListBase,
    string | undefined,
    State,
    ScreenOptions,
    EventMap,
    any
  > &
    RouterOptions
) {
  const navigatorKey = useRegisterNavigator();

  const route = React.useContext(NavigationRouteContext) as
    | NavigatorRoute
    | undefined;

  const isNestedParamsConsumed =
    typeof route?.params === 'object' && route.params != null
      ? CONSUMED_PARAMS in route.params &&
        route.params[CONSUMED_PARAMS] === route.params
      : false;

  const {
    children,
    layout,
    screenOptions,
    screenLayout,
    screenListeners,
    UNSTABLE_router,
    ...rest
  } = options;

  const routeConfigs = getRouteConfigsFromChildren<
    State,
    ScreenOptions,
    EventMap
  >(children);

  const router = useLazyValue<Router<State, any>>(() => {
    if (
      rest.initialRouteName != null &&
      routeConfigs.every(
        (config) => config.props.name !== rest.initialRouteName
      )
    ) {
      throw new Error(
        `Couldn't find a screen named '${rest.initialRouteName}' to use as 'initialRouteName'.`
      );
    }

    const original = createRouter(rest as unknown as RouterOptions);

    if (UNSTABLE_router != null) {
      const overrides = UNSTABLE_router(original);

      return {
        ...original,
        ...overrides,
      };
    }

    return original;
  });

  const screens = routeConfigs.reduce<
    Record<string, ScreenConfigWithParent<State, ScreenOptions, EventMap>>
  >((acc, config) => {
    if (config.props.name in acc) {
      throw new Error(
        `A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named '${config.props.name}')`
      );
    }

    acc[config.props.name] = config;
    return acc;
  }, {});

  const routeNames = routeConfigs.map((config) => config.props.name);
  const routeKeyList = routeNames.reduce<Record<string, React.Key | undefined>>(
    (acc, curr) => {
      acc[curr] = screens[curr].keys.map((key) => key ?? '').join(':');
      return acc;
    },
    {}
  );
  const routeParamList = routeNames.reduce<Record<string, object | undefined>>(
    (acc, curr) => {
      const { initialParams } = screens[curr].props;
      acc[curr] = initialParams;
      return acc;
    },
    {}
  );
  const routeGetIdList = routeNames.reduce<
    RouterConfigOptions['routeGetIdList']
  >(
    (acc, curr) =>
      Object.assign(acc, {
        [curr]: screens[curr].props.getId,
      }),
    {}
  );

  if (!routeNames.length) {
    throw new Error(
      "Couldn't find any screens for the navigator. Have you defined any screens as its children?"
    );
  }

  const isStateValid = React.useCallback(
    (state: NavigationState | PartialState<NavigationState>) =>
      state.type === undefined || state.type === router.type,
    [router.type]
  );

  const isStateInitialized = React.useCallback(
    <T extends NavigationState>(
      state: T | PartialState<T> | undefined
    ): state is T =>
      state !== undefined && state.stale === false && isStateValid(state),
    [isStateValid]
  );

  const doesStateHaveOnlyInvalidRoutes = React.useCallback(
    (state: NavigationState | PartialState<NavigationState>) =>
      state.routes.every((r) => !routeNames.includes(r.name)),
    [routeNames]
  );

  const {
    state: currentState,
    getState: getCurrentState,
    setState: setCurrentState,
    setKey,
    getKey,
    getIsInitial,
  } = React.useContext(NavigationStateContext);

  const stateCleanupRef = React.useRef<boolean>(false);
  const lastStateRef = React.useRef<State | PartialState<State> | undefined>(
    undefined
  );

  const setState = useLatestCallback(
    (state: State | PartialState<State> | undefined) => {
      if (stateCleanupRef.current) {
        // Store the state locally in case the current navigator is in `Activity`
        lastStateRef.current = state;

        // State might have been already cleaned up due to unmount
        // We don't want to update `route.state` in parent
        // Otherwise it will be reused if a new navigator gets mounted
        return;
      }

      setCurrentState(state);
    }
  );

  const [
    stateBeforeInitialization,
    initializedState,
    isFirstStateInitialization,
    paramsUsedForInitialization,
  ] = React.useMemo((): [
    PartialState<State> | undefined,
    State | undefined,
    boolean,
    object | undefined,
  ] => {
    // If the state was already cleaned up, but we have it stored in ref,
    // It likely got cleaned up due to `<Activity mode="hidden">`
    // We should reuse this state to avoid remounting screens
    if (
      stateCleanupRef.current &&
      lastStateRef.current &&
      isStateValid(lastStateRef.current)
    ) {
      const state: State = isStateInitialized(lastStateRef.current)
        ? lastStateRef.current
        : router.getRehydratedState(lastStateRef.current, {
            routeNames,
            routeParamList,
            routeGetIdList,
          });

      return [undefined, state, false, undefined];
    }

    const initialRouteParamList = routeNames.reduce<
      Record<string, object | undefined>
    >((acc, curr) => {
      const { initialParams } = screens[curr].props;
      const initialParamsFromParams =
        route?.params?.state == null &&
        route?.params?.initial !== false &&
        route?.params?.screen === curr
          ? route.params.params
          : undefined;

      acc[curr] =
        initialParams !== undefined || initialParamsFromParams !== undefined
          ? {
              ...initialParams,
              ...initialParamsFromParams,
            }
          : undefined;

      return acc;
    }, {});

    // If the current state isn't initialized on first render, we initialize it
    // We also need to re-initialize it if the state passed from parent was changed (maybe due to reset)
    // Otherwise assume that the state was provided as initial state
    // So we need to rehydrate it to make it usable
    if (
      (currentState === undefined || !isStateValid(currentState)) &&
      route?.params?.state == null &&
      !(
        typeof route?.params?.screen === 'string' &&
        route?.params?.initial !== false
      ) &&
      !isNestedParamsConsumed
    ) {
      return [
        undefined,
        router.getInitialState({
          routeNames,
          routeParamList: initialRouteParamList,
          routeGetIdList,
        }),
        true,
        undefined,
      ];
    } else {
      const paramsForState = isNestedParamsConsumed ? undefined : route?.params;
      const stateFromParams = paramsForState
        ? getStateFromParams(paramsForState)
        : undefined;

      const stateBeforeInitialization = (stateFromParams ?? currentState) as
        | PartialState<State>
        | undefined;

      const hydratedState =
        stateBeforeInitialization == null
          ? router.getInitialState({
              routeNames,
              routeParamList: initialRouteParamList,
              routeGetIdList,
            })
          : router.getRehydratedState(stateBeforeInitialization, {
              routeNames,
              routeParamList: initialRouteParamList,
              routeGetIdList,
            });

      if (
        stateBeforeInitialization != null &&
        options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
        doesStateHaveOnlyInvalidRoutes(stateBeforeInitialization)
      ) {
        return [stateBeforeInitialization, hydratedState, true, paramsForState];
      }

      return [undefined, hydratedState, false, paramsForState];
    }
    // We explicitly don't include routeNames, route.params etc. in the dep list
    // below. We want to avoid forcing a new state to be calculated in those cases
    // Instead, we handle changes to these in the nextState code below. Note
    // that some changes to routeConfigs are explicitly ignored, such as changes
    // to initialParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, router, isStateValid]);

  const previousRouteKeyListRef = React.useRef(routeKeyList);

  React.useEffect(() => {
    previousRouteKeyListRef.current = routeKeyList;
  });

  const previousRouteKeyList = previousRouteKeyListRef.current;

  const [unhandledState, setUnhandledState] = React.useState<
    NavigationState | PartialState<NavigationState> | undefined
  >(stateBeforeInitialization);

  // An unhandled state is state that didn't have any valid routes
  // So it was unhandled, i.e. not used for initializing the state
  // It's possible that they were absent due to conditional render
  // Store this state so we can reuse it if the routes change later
  if (
    options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
    stateBeforeInitialization &&
    unhandledState !== stateBeforeInitialization
  ) {
    setUnhandledState(stateBeforeInitialization);
  }

  let state =
    // If the state isn't initialized, or stale, use the state we initialized instead
    // The state won't update until there's a change needed in the state we have initialized locally
    // So it'll be `undefined` or stale until the first navigation event happens
    isStateInitialized(currentState)
      ? (currentState as State)
      : (initializedState as State);

  let nextState: State = state;
  let shouldClearUnhandledState = false;

  // Previously unhandled state is now valid again
  // And current state no longer has any valid routes
  // We should reuse the unhandled state instead of re-calculating the state
  if (
    unhandledState?.routes.every((r) => routeNames.includes(r.name)) &&
    state?.routes.every((r) => !routeNames.includes(r.name))
  ) {
    shouldClearUnhandledState = true;
    nextState = router.getRehydratedState(
      unhandledState as PartialState<State>,
      {
        routeNames,
        routeParamList,
        routeGetIdList,
      }
    );
  } else if (
    !isArrayEqual(state.routeNames, routeNames) ||
    !isRecordEqual(routeKeyList, previousRouteKeyList)
  ) {
    // When the list of route names change, the router should handle it to remove invalid routes
    nextState = router.getStateForRouteNamesChange(state, {
      routeNames,
      routeParamList,
      routeGetIdList,
      routeKeyChanges: Object.keys(routeKeyList).filter(
        (name) =>
          name in previousRouteKeyList &&
          routeKeyList[name] !== previousRouteKeyList[name]
      ),
    });
  }

  let didConsumeNestedParams = route?.params === paramsUsedForInitialization;

  if (route?.params && !didConsumeNestedParams) {
    let action: CommonActions.Action | undefined;

    if (
      typeof route.params.state === 'object' &&
      route.params.state != null &&
      !isNestedParamsConsumed
    ) {
      didConsumeNestedParams = true;

      if (
        options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
        doesStateHaveOnlyInvalidRoutes(route.params.state)
      ) {
        if (route.params.state !== unhandledState) {
          setUnhandledState(route.params.state);
        }
      } else {
        // If the route was updated with new state, we should reset to it
        action = CommonActions.reset(route.params.state);
      }
    } else if (
      typeof route.params.screen === 'string' &&
      ((route.params.initial === false && isFirstStateInitialization) ||
        !isNestedParamsConsumed)
    ) {
      didConsumeNestedParams = true;

      if (
        options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
        !routeNames.includes(route.params.screen)
      ) {
        const state = getStateFromParams(route.params);

        if (state != null && !deepEqual(state, unhandledState)) {
          setUnhandledState(state);
        }
      } else {
        // If the route was updated with new screen name and/or params, we should navigate there
        action = CommonActions.navigate({
          name: route.params.screen,
          params: route.params.params,
          path: route.params.path,
          merge: route.params.merge,
          pop: route.params.pop,
        });
      }
    }

    // The update should be limited to current navigator only, so we call the router manually
    const updatedState = action
      ? router.getStateForAction(nextState, action, {
          routeNames,
          routeParamList,
          routeGetIdList,
        })
      : null;

    nextState =
      updatedState !== null
        ? router.getRehydratedState(updatedState, {
            routeNames,
            routeParamList,
            routeGetIdList,
          })
        : nextState;
  }

  React.useEffect(() => {
    if (
      didConsumeNestedParams &&
      typeof route?.params === 'object' &&
      route.params != null
    ) {
      // Track whether the params have been already consumed
      // Set it to the same object, so merged params can be handled again
      Object.defineProperty(route.params, CONSUMED_PARAMS, {
        value: route.params,
        enumerable: false,
      });
    }
  }, [didConsumeNestedParams, route?.params]);

  const shouldUpdate = state !== nextState;

  useScheduleUpdate(() => {
    if (shouldUpdate) {
      // Schedule an update if the state needs to be updated
      setState(nextState);

      if (shouldClearUnhandledState) {
        setUnhandledState(undefined);
      }
    }
  });

  // The up-to-date state will come in next render, but we don't need to wait for it
  // We can't use the outdated state since the screens have changed, which will cause error due to mismatched config
  // So we override the state object we return to use the latest state as soon as possible
  state = nextState;

  // Last state to reuse if component gets cleaned up due to `<Activity mode="hidden">`
  React.useEffect(() => {
    lastStateRef.current = state;
  });

  const lastNotifiedStateRef = React.useRef<State | null>(null);

  React.useEffect(() => {
    // In strict mode, React will double-invoke effects.
    // So we need to reset the flag if component was not unmounted
    stateCleanupRef.current = false;

    setKey(navigatorKey);

    if (!getIsInitial() && lastNotifiedStateRef.current !== state) {
      // If it's not initial render, we need to update the state
      // This will make sure that our container gets notifier of state changes due to new mounts
      // This is necessary for proper screen tracking, URL updates etc.
      // We only notify if the state is different what we already notified
      // Otherwise this goes into a loop when inside `<Activity mode="hidden">`
      setState(state);
      lastNotifiedStateRef.current = state;
    }

    return () => {
      // We need to clean up state for this navigator on unmount
      if (getCurrentState() !== undefined && getKey() === navigatorKey) {
        setCurrentState(undefined);
        stateCleanupRef.current = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In some cases (e.g. route names change), internal state might have changed
  // But it hasn't been committed yet, so hasn't propagated to the sync external store
  // During this time, we need to return the internal state in `getState`
  // Otherwise it can result in inconsistent state during render in children
  // To avoid this, we use a ref for render phase, and immediately clear it on commit
  const stateRef = React.useRef<State | null>(state);

  stateRef.current = state;

  useClientLayoutEffect(() => {
    stateRef.current = null;
  });

  const getState = useLatestCallback((): State => {
    const currentState = getCurrentState();

    return deepFreeze(
      (isStateInitialized(currentState)
        ? currentState
        : initializedState) as State
    );
  });

  const emitter = useEventEmitter<EventMapCore<State>>((e) => {
    const routeNames = [];

    let route: Route<string> | undefined;

    if (e.target) {
      route = state.routes.find((route) => route.key === e.target);

      if (route?.name) {
        routeNames.push(route.name);
      }
    } else {
      route = state.routes[state.index];
      routeNames.push(
        ...Object.keys(screens).filter((name) => route?.name === name)
      );
    }

    if (route == null) {
      return;
    }

    const navigation = descriptors[route.key].navigation;

    const listeners = ([] as (((e: any) => void) | undefined)[])
      .concat(
        // Get an array of listeners for all screens + common listeners on navigator
        ...[
          screenListeners,
          ...routeNames.map((name) => {
            const { listeners } = screens[name].props;
            return listeners;
          }),
        ].map((listeners) => {
          const map =
            typeof listeners === 'function'
              ? listeners({ route: route as any, navigation })
              : listeners;

          return map
            ? Object.keys(map)
                .filter((type) => type === e.type)
                .map((type) => map?.[type])
            : undefined;
        })
      )
      // We don't want same listener to be called multiple times for same event
      // So we remove any duplicate functions from the array
      .filter((cb, i, self) => cb && self.lastIndexOf(cb) === i);

    listeners.forEach((listener) => listener?.(e));
  });

  useFocusEvents({ state, emitter });

  React.useEffect(() => {
    emitter.emit({ type: 'state', data: { state } });
  }, [emitter, state]);

  const { listeners: childListeners, addListener } = useChildListeners();

  const { keyedListeners, addKeyedListener } = useKeyedChildListeners();

  const onAction = useOnAction({
    router,
    getState,
    setState,
    key: route?.key,
    actionListeners: childListeners.action,
    beforeRemoveListeners: keyedListeners.beforeRemove,
    routerConfigOptions: {
      routeNames,
      routeParamList,
      routeGetIdList,
    },
    emitter,
  });

  const onRouteFocus = useOnRouteFocus({
    router,
    key: route?.key,
    getState,
    setState,
  });

  const onUnhandledActionParent = React.useContext(UnhandledActionContext);

  const onUnhandledAction = useLatestCallback((action: NavigationAction) => {
    if (
      options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
      action.type === 'NAVIGATE' &&
      action.payload != null &&
      'name' in action.payload &&
      typeof action.payload.name === 'string' &&
      !routeNames.includes(action.payload.name)
    ) {
      const state = {
        routes: [
          {
            name: action.payload.name,
            params:
              'params' in action.payload &&
              typeof action.payload.params === 'object' &&
              action.payload.params !== null
                ? action.payload.params
                : undefined,
            path:
              'path' in action.payload &&
              typeof action.payload.path === 'string'
                ? action.payload.path
                : undefined,
          },
        ],
      };

      setUnhandledState(state);
    }

    onUnhandledActionParent?.(action);
  });

  const navigation = useNavigationHelpers<
    State,
    ActionHelpers,
    NavigationAction,
    EventMap
  >({
    id: options.id,
    onAction,
    onUnhandledAction,
    getState,
    emitter,
    router,
    stateRef,
  });

  useFocusedListenersChildrenAdapter({
    navigation,
    focusedListeners: childListeners.focus,
  });

  useOnGetState({
    getState,
    getStateListeners: keyedListeners.getState,
  });

  const { describe, descriptors } = useDescriptors<
    State,
    ActionHelpers,
    ScreenOptions,
    EventMap
  >({
    state,
    screens,
    navigation,
    screenOptions,
    screenLayout,
    onAction,
    getState,
    setState,
    onRouteFocus,
    addListener,
    addKeyedListener,
    router,
    // @ts-expect-error: this should have both core and custom events, but too much work right now
    emitter,
  });

  useCurrentRender({
    state,
    navigation,
    descriptors,
  });

  const NavigationContent = useComponent((children: React.ReactNode) => {
    const element =
      layout != null
        ? layout({
            state,
            descriptors,
            navigation,
            children,
          })
        : children;

    return (
      <NavigationMetaContext.Provider value={undefined}>
        <NavigationHelpersContext.Provider value={navigation}>
          <NavigationStateListenerProvider state={state}>
            <FocusedRouteKeyContext.Provider
              value={state.routes[state.index].key}
            >
              <PreventRemoveProvider>{element}</PreventRemoveProvider>
            </FocusedRouteKeyContext.Provider>
          </NavigationStateListenerProvider>
        </NavigationHelpersContext.Provider>
      </NavigationMetaContext.Provider>
    );
  });

  return {
    state,
    navigation,
    describe,
    descriptors,
    NavigationContent,
  };
}
