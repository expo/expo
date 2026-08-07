'use client';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import { use } from 'react';
// TODO(@ubax) - RN Migration: remove this dependency and just add this function to our codebase
import { isValidElementType } from 'react-is';

import useLatestCallback from '../../utils/useLatestCallback';
import {
  ensureStateKeys,
  type DefaultRouterOptions,
  type KeyedPartialState,
  type NavigationAction,
  type NavigationState,
  type NavigatorParamsPayload,
  type ParamListBase,
  type PartialState,
  type Route,
  type RenderState,
  type Router,
  type RouterConfigOptions,
  type RouterFactory,
} from '../routers';
import { Group } from './Group';
import { NavigationHelpersContext } from './NavigationHelpersContext';
import { NavigationMetaContext } from './NavigationMetaContext';
import { NavigationRouteContext } from './NavigationProvider';
import { NavigationStateContext } from './NavigationStateContext';
import { PreventRemoveContext } from './PreventRemoveContext';
import { Screen } from './Screen';
import { UnhandledActionContext } from './UnhandledActionContext';
import { deepFreeze } from './deepFreeze';
import { isArrayEqual } from './isArrayEqual';
import { isRecordEqual } from './isRecordEqual';
import {
  type DefaultNavigatorOptions,
  type DescriptorRouteProp,
  type EventMapBase,
  type EventMapCore,
  type NavigatorScreenParams,
  PrivateValueStore,
  type RouteConfig,
} from './types';
import { useChildListeners } from './useChildListeners';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useComponent } from './useComponent';
import { useCurrentRender } from './useCurrentRender';
import { type ScreenConfigWithParent, useDescriptors } from './useDescriptors';
import { useEventEmitter } from './useEventEmitter';
import { useFocusEvents } from './useFocusEvents';
import { useFocusedListenersChildrenAdapter } from './useFocusedListenersChildrenAdapter';
import { FocusedRouteKeyContext } from './useIsFocused';
import { useKeyedChildListeners } from './useKeyedChildListeners';
import { useLazyValue } from './useLazyValue';
import { useNavigationHelpers } from './useNavigationHelpers';
import { NavigationStateListenerProvider } from './useNavigationState';
import { useOnAction } from './useOnAction';
import { useOnGetState } from './useOnGetState';
import { useOnRouteFocus } from './useOnRouteFocus';
import { usePreventRemoveState } from './usePreventRemoveState';
import { useRegisterNavigator } from './useRegisterNavigator';

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
}> => {
  return child.type === Screen;
};

const isGroup = (
  child: React.ReactElement<unknown>
): child is React.ReactElement<{
  screenOptions?: unknown;
  screenLayout?: unknown;
  children?: unknown;
}> => {
  return child.type === React.Fragment || child.type === Group;
};

/**
 * Extract route config object from React children elements.
 *
 * @param children React Elements to extract the config from.
 */
const getRouteConfigsFromChildren = <
  State extends NavigationState,
  ScreenOptions extends object,
  EventMap extends EventMapBase,
>(
  children: React.ReactNode,
  groupOptions?: ScreenConfigWithParent<State, ScreenOptions, EventMap>['options'],
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

        acc.push({
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
        // When we encounter a fragment or group, we need to dive into its children to extract the configs
        // This is handy to conditionally define a group of screens
        acc.push(
          ...getRouteConfigsFromChildren<State, ScreenOptions, EventMap>(
            child.props.children as React.ReactNode,
            // FIXME
            // @ts-expect-error: add validation
            child.type !== Group
              ? groupOptions
              : groupOptions != null
                ? [...groupOptions, child.props.screenOptions]
                : [child.props.screenOptions],
            typeof child.props.screenLayout === 'function' ? child.props.screenLayout : groupLayout
          )
        );

        return acc;
      }
    }

    throw new Error(
      `A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found ${
        React.isValidElement(child)
          ? `'${typeof child.type === 'string' ? child.type : child.type?.name}'${
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

      if (children != null || component !== undefined || getComponent !== undefined) {
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
  ScreenOptions extends object,
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

  const route = use(NavigationRouteContext) as NavigatorRoute | undefined;

  const isNestedParamsConsumed =
    typeof route?.params === 'object' && route.params != null
      ? CONSUMED_PARAMS in route.params && route.params[CONSUMED_PARAMS] === route.params
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

  const routeConfigs = getRouteConfigsFromChildren<State, ScreenOptions, EventMap>(children);

  const router = useLazyValue<Router<State, any>>(() => {
    if (
      rest.initialRouteName != null &&
      routeConfigs.every((config) => config.props.name !== rest.initialRouteName)
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
  const routeParamList = routeNames.reduce<Record<string, object | undefined>>((acc, curr) => {
    const { initialParams } = screens[curr]!.props;
    acc[curr] = initialParams;
    return acc;
  }, {});
  const routeGetIdList = routeNames.reduce<RouterConfigOptions['routeGetIdList']>(
    (acc, curr) =>
      Object.assign(acc, {
        [curr]: screens[curr]!.props.getId,
      }),
    {}
  );

  if (!routeNames.length) {
    throw new Error(
      "Couldn't find any screens for the navigator. Have you defined any screens as its children?"
    );
  }

  const isStateValid = React.useCallback(
    (state: NavigationState | PartialState<NavigationState> | RenderState<NavigationState>) =>
      state.type === undefined || state.type === router.type,
    [router.type]
  );

  const isStateInitialized = React.useCallback(
    <T extends NavigationState>(
      state: T | PartialState<T> | RenderState<T> | undefined
    ): state is T => state !== undefined && state.stale === false && isStateValid(state),
    [isStateValid]
  );

  const {
    state: currentState,
    getState: getCurrentState,
    setState: setCurrentState,
    setKey,
    getKey,
    getIsInitial,
  } = use(NavigationStateContext);

  const stateCleanupRef = React.useRef<boolean>(false);
  const lastStateRef = React.useRef<RenderState<State> | PartialState<State> | undefined>(
    undefined
  );

  const setState = useLatestCallback((state: State | PartialState<State> | undefined) => {
    if (stateCleanupRef.current) {
      // Store the state locally in case the current navigator is in `Activity`
      lastStateRef.current = state;

      // State might have been already cleaned up due to unmount
      // We don't want to update `route.state` in parent
      // Otherwise it will be reused if a new navigator gets mounted
      return;
    }

    setCurrentState(state);
  });

  const keyedNestedParams = React.useMemo(() => {
    if (isNestedParamsConsumed || route?.params == null) {
      return undefined;
    }

    const stateFromParams = getStateFromParams(route.params);

    return {
      params: route.params,
      state: stateFromParams ? ensureStateKeys(stateFromParams, router.type) : undefined,
      routeKey: `${route.params.screen ?? routeNames[0]}-${nanoid()}`,
    };
    // Route names are handled by the declared-routes projection below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNestedParamsConsumed, route?.params, router.type]);

  const [initializedState, isFirstStateInitialization, paramsUsedForInitialization] =
    React.useMemo((): [RenderState<State> | undefined, boolean, object | undefined] => {
      // If the state was already cleaned up, but we have it stored in ref,
      // It likely got cleaned up due to `<Activity mode="hidden">`
      // We should reuse this state to avoid remounting screens
      if (stateCleanupRef.current && lastStateRef.current && isStateValid(lastStateRef.current)) {
        return [lastStateRef.current as RenderState<State>, false, undefined];
      }

      const initialRouteParamList = routeNames.reduce<Record<string, object | undefined>>(
        (acc, curr) => {
          const { initialParams } = screens[curr]!.props;
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
        },
        {}
      );

      // If the current state isn't initialized on first render, we initialize it
      // We also need to re-initialize it if the state passed from parent was changed (maybe due to reset)
      // Otherwise assume that the state was provided as initial state
      // So we need to rehydrate it to make it usable
      if (
        (currentState === undefined || !isStateValid(currentState)) &&
        route?.params?.state == null &&
        !(typeof route?.params?.screen === 'string' && route?.params?.initial !== false) &&
        !isNestedParamsConsumed
      ) {
        return [
          router.getInitialState({
            routeNames,
            routeParamList: initialRouteParamList,
            routeGetIdList,
          }),
          true,
          undefined,
        ];
      } else {
        const existingState = currentState ?? lastStateRef.current;
        const shouldInitializeFromParams = existingState == null || !isStateValid(existingState);
        const paramsForState = shouldInitializeFromParams ? keyedNestedParams?.params : undefined;
        const keyedState = (
          shouldInitializeFromParams
            ? keyedNestedParams?.state
            : ensureStateKeys(existingState, router.type)
        ) as RenderState<State> | undefined;

        const stateForRender =
          keyedState == null
            ? router.getInitialState({
                routeNames,
                routeParamList: initialRouteParamList,
                routeGetIdList,
              })
            : {
                ...keyedState,
                routes: keyedState.routes.map((route) => ({
                  ...route,
                  params:
                    initialRouteParamList[route.name] !== undefined
                      ? { ...initialRouteParamList[route.name], ...route.params }
                      : route.params,
                })),
              };

        return [stateForRender as RenderState<State>, false, paramsForState];
      }
      // We explicitly don't include routeNames, route.params etc. in the dep list
      // below. We want to avoid forcing a new state to be calculated in those cases
      // Instead, we handle changes to these in the nextState code below. Note
      // that some changes to routeConfigs are explicitly ignored, such as changes
      // to initialParams
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentState, router, isStateValid, keyedNestedParams]);

  let state: RenderState<State> =
    // If the state isn't initialized, or stale, use the state we initialized instead
    // The state won't update until there's a change needed in the state we have initialized locally
    // So it'll be `undefined` or stale until the first navigation event happens
    isStateInitialized(currentState)
      ? (currentState as State)
      : (initializedState as RenderState<State>);

  let nextState = state;

  let didConsumeNestedParams = route?.params === paramsUsedForInitialization;

  if (route?.params && !didConsumeNestedParams) {
    let params: NavigatorParamsPayload | undefined;

    if (
      typeof route.params.state === 'object' &&
      route.params.state != null &&
      !isNestedParamsConsumed
    ) {
      didConsumeNestedParams = true;

      params = { state: keyedNestedParams!.state! };
    } else if (
      typeof route.params.screen === 'string' &&
      ((route.params.initial === false && isFirstStateInitialization) || !isNestedParamsConsumed)
    ) {
      didConsumeNestedParams = true;

      params = {
        screen: route.params.screen,
        params: route.params.params,
        path: route.params.path,
        merge: route.params.merge,
        pop: route.params.pop,
        routeKey: keyedNestedParams!.routeKey,
      };
    }

    const updatedState = params
      ? router.getStateForNavigatorParams?.(
          // The render state has recursively keyed routes and is valid keyed stale router input.
          nextState as KeyedPartialState<State> | State,
          params,
          {
            routeNames,
            routeParamList,
            routeGetIdList,
          }
        )
      : null;

    // The declared-routes projection below fills the required render fields on keyed stale output.
    nextState = (updatedState ?? nextState) as RenderState<State>;
  }

  // The up-to-date state will come in next render, but we don't need to wait for it
  // We can't use the outdated state since the screens have changed, which will cause error due to mismatched config
  // So we override the state object we return to use the latest state as soon as possible
  const needsFallbackRoute = !nextState.routes.some((route) => routeNames.includes(route.name));
  const fallbackRouteKey = React.useMemo(
    () => (needsFallbackRoute ? `${routeNames[0]}-${nanoid()}` : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [needsFallbackRoute, routeNames[0]]
  );

  // TODO: Remove this projection once stale state can only contain declared routes.
  const stateWithDeclaredFields =
    nextState.type === router.type &&
    nextState.routeNames !== undefined &&
    isArrayEqual(nextState.routeNames, routeNames)
      ? nextState
      : ({ ...nextState, routeNames, type: router.type } as KeyedPartialState<State> | State);
  state = router.getStateForDeclaredRoutes(
    // Render state has the same recursively keyed shape accepted by keyed stale router input.
    stateWithDeclaredFields as KeyedPartialState<State> | State,
    routeNames,
    fallbackRouteKey
  ) as RenderState<State>;

  // Last state to reuse if component gets cleaned up due to `<Activity mode="hidden">`
  React.useEffect(() => {
    lastStateRef.current = nextState;
  });

  const lastNotifiedStateRef = React.useRef<RenderState<State> | null>(null);

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
      // Render state has all fields accepted by the stale store shape, with stronger nested keys.
      setState(nextState as PartialState<State>);
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
  const stateRef = React.useRef<RenderState<State> | null>(state);

  stateRef.current = state;

  useClientLayoutEffect(() => {
    stateRef.current = null;
  });

  const hydrationCacheRef = React.useRef<
    | {
        base: State | PartialState<State>;
        routeNames: string[];
        routeParamList: Record<string, object | undefined>;
        routeGetIdList: RouterConfigOptions['routeGetIdList'];
        state: State;
      }
    | undefined
  >(undefined);

  const getState = useLatestCallback((): State => {
    const current = getCurrentState();
    const base = (current && isStateValid(current) ? current : initializedState) as
      | State
      | PartialState<State>;

    if (isStateInitialized(base)) {
      return deepFreeze(base);
    }

    const cached = hydrationCacheRef.current;
    if (
      cached?.base === base &&
      isArrayEqual(cached.routeNames, routeNames) &&
      isRecordEqual(cached.routeParamList, routeParamList) &&
      isRecordEqual(cached.routeGetIdList, routeGetIdList)
    ) {
      return cached.state;
    }

    const hydrated = deepFreeze(
      router.getRehydratedState(base, { routeNames, routeParamList, routeGetIdList })
    );
    hydrationCacheRef.current = {
      base,
      routeNames,
      routeParamList,
      routeGetIdList,
      state: hydrated,
    };
    return hydrated;
  });

  const emitter = useEventEmitter<EventMapCore<State>>((e) => {
    const routeNames = [];

    let route: Route<string> | undefined;
    let isPlaceholder = false;

    if (e.target) {
      route = state.routes.find((route) => route.key === e.target);
      const config = screens[e.target];

      if (!route && config) {
        route = { key: e.target, name: e.target, params: config.props.initialParams };
        isPlaceholder = true;
      }

      if (route?.name) {
        routeNames.push(route.name);
      }
    } else {
      route = state.routes[state.index];
      routeNames.push(...Object.keys(screens).filter((name) => route?.name === name));
    }

    if (route == null) {
      return;
    }

    const descriptor = isPlaceholder
      ? describe({ ...route, key: undefined } as DescriptorRouteProp<ParamListBase, string>)
      : descriptors[route.key]!;
    const navigation = descriptor.navigation;

    const listeners = ([] as (((e: any) => void) | undefined)[])
      .concat(
        // Get an array of listeners for all screens + common listeners on navigator
        ...[
          screenListeners,
          ...routeNames.map((name) => {
            const { listeners } = screens[name]!.props;
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
    emitter.emit({ type: 'state', data: { state: getState() } });
  }, [emitter, getState, state]);

  const { listeners: childListeners, addListener } = useChildListeners();

  const { keyedListeners, addKeyedListener } = useKeyedChildListeners();

  const { isRoutePrevented, preventRemoveContextValue } = usePreventRemoveState({
    getState,
    state,
  });

  const onAction = useOnAction({
    router,
    getState,
    setState,
    key: route?.key,
    actionListeners: childListeners.action,
    preventRemoveListeners: keyedListeners.preventRemove,
    beforeRemoveListeners: keyedListeners.beforeRemove,
    isRoutePrevented,
    routerConfigOptions: {
      routeNames,
      routeParamList,
      routeGetIdList,
    },
    emitter,
  });

  useClientLayoutEffect(() => {
    const committed = getCurrentState() ?? initializedState;

    if (
      committed &&
      (isStateInitialized(committed)
        ? !isArrayEqual(committed.routeNames, routeNames)
        : committed.routes.some((route) => !routeNames.includes(route.name)))
    ) {
      onAction({
        type: 'ROUTE_NAMES_CHANGED',
        payload: { routeNames, fallbackRouteKey },
        target: committed.key,
      });
    }

    if (
      didConsumeNestedParams &&
      typeof route?.params === 'object' &&
      route.params != null &&
      !(CONSUMED_PARAMS in route.params && route.params[CONSUMED_PARAMS] === route.params)
    ) {
      Object.defineProperty(route.params, CONSUMED_PARAMS, {
        value: route.params,
        enumerable: false,
        configurable: true,
      });
      const params: NavigatorParamsPayload =
        route.params.state != null
          ? { state: keyedNestedParams!.state! }
          : {
              screen: route.params.screen!,
              params: route.params.params,
              path: route.params.path,
              merge: route.params.merge,
              pop: route.params.pop,
              routeKey: keyedNestedParams!.routeKey,
            };
      onAction({ type: 'NAVIGATOR_PARAMS_CHANGED', payload: { params }, target: state.key });
    }
  });

  const onRouteFocus = useOnRouteFocus({
    router,
    key: route?.key,
    getState,
    setState,
  });

  const onUnhandledActionParent = use(UnhandledActionContext);

  const onUnhandledAction = useLatestCallback((action: NavigationAction) => {
    onUnhandledActionParent?.(action);
  });

  const navigation = useNavigationHelpers<State, ActionHelpers, NavigationAction, EventMap>({
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

  const { describe, descriptors } = useDescriptors<State, ActionHelpers, ScreenOptions, EventMap>({
    routes: state.routes,
    routeNames: state.routeNames,
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
            <FocusedRouteKeyContext.Provider value={state.routes[state.index]?.key}>
              <PreventRemoveContext.Provider value={preventRemoveContextValue}>
                {element}
              </PreventRemoveContext.Provider>
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
