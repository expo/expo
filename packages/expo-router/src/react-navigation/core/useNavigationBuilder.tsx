'use client';
import deepEqual from 'fast-deep-equal';
import * as React from 'react';
import { use } from 'react';
// TODO(@ubax) - RN Migration: remove this dependency and just add this function to our codebase
import { isValidElementType } from 'react-is';

import {
  type NavigationReducer,
  type NavigatorRegistryEntry,
  ReducerRegistryContext,
} from '../../global-state/storeContext';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  CommonActions,
  type DefaultRouterOptions,
  type InternalRouter,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type Route,
  type RouterConfigOptions,
  type RouterFactory,
} from '../routers';
import { getRouteKey } from '../routers/getRouteKey';
import { Group } from './Group';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationHelpersContext } from './NavigationHelpersContext';
import { NavigationMetaContext } from './NavigationMetaContext';
import { NavigationRouteContext } from './NavigationProvider';
import { NavigationStateContext } from './NavigationStateContext';
import { PreventRemoveProvider } from './PreventRemoveProvider';
import { Screen } from './Screen';
import { UnhandledActionContext } from './UnhandledActionContext';
import { deepFreeze } from './deepFreeze';
import { isArrayEqual } from './isArrayEqual';
import { isRecordEqual } from './isRecordEqual';
import {
  type DefaultNavigatorOptions,
  type EventMapBase,
  type EventMapCore,
  type NavigatorScreenParams,
  PrivateValueStore,
  type RouteConfig,
} from './types';
import { useChildListeners } from './useChildListeners';
import { useClientInsertionEffect } from './useClientInsertionEffect';
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
import { useOnGetState } from './useOnGetState';
import { shouldPreventRemove, useOnPreventRemove } from './useOnPreventRemove';
import { useRegisterNavigator } from './useRegisterNavigator';
import { useStoreSlice } from './useStoreSlice';

// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;

type NavigatorRoute = {
  key: string;
  params?: NavigatorScreenParams<ParamListBase>;
};

const CONSUMED_PARAMS = Symbol('CONSUMED_PARAMS');
const RECONCILE_ROUTE_NAMES = '__unsafe_reconcile_route_names__';

type ReconcileRouteNamesAction = NavigationAction & {
  type: typeof RECONCILE_ROUTE_NAMES;
  payload: RouterConfigOptions & {
    routeKeyChanges: string[];
    unhandledState?: NavigationState | PartialState<NavigationState>;
  };
};

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
  ScreenOptions extends object,
  EventMap extends EventMapBase,
>(
  children: React.ReactNode,
  groupKey?: string,
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

        if (
          child.props.navigationKey !== undefined &&
          (typeof child.props.navigationKey !== 'string' || child.props.navigationKey === '')
        ) {
          throw new Error(
            `Got an invalid 'navigationKey' prop (${JSON.stringify(
              child.props.navigationKey
            )}) for the screen '${child.props.name}'. It must be a non-empty string or 'undefined'.`
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

const isReconcileRouteNamesAction = (
  action: NavigationAction
): action is ReconcileRouteNamesAction => action.type === RECONCILE_ROUTE_NAMES;

function getStateForRenderableRoutes<State extends NavigationState>(
  state: State,
  routeNames: string[],
  routeKeyChanges: string[],
  initialRouteName: string | undefined,
  routeParamList: Record<string, object | undefined>
): State {
  const routes = state.routes.filter(
    (route) => routeNames.includes(route.name) && !routeKeyChanges.includes(route.name)
  );

  if (routes.length === state.routes.length && isArrayEqual(state.routeNames, routeNames)) {
    return state;
  }

  if (routes.length === 0) {
    const name =
      initialRouteName !== undefined && routeNames.includes(initialRouteName)
        ? initialRouteName
        : routeNames[0];

    if (name == null) {
      return state;
    }

    const route: Route<string> =
      routeParamList[name] !== undefined
        ? {
            key: getRouteKey({ stateKey: state.key, name }),
            name,
            params: routeParamList[name],
          }
        : {
            key: getRouteKey({ stateKey: state.key, name }),
            name,
          };

    return {
      ...state,
      index: 0,
      routeNames,
      routes: [route] as State['routes'],
    };
  }

  return {
    ...state,
    index: Math.min(
      Math.max(
        routes.findIndex((route) => route.key === state.routes[state.index]?.key),
        0
      ),
      routes.length - 1
    ),
    routeNames,
    routes: routes as State['routes'],
  };
}

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

  // This navigator's own route key, threaded into every routerConfigOptions as `parentRouteKey` so
  // routers derive their state key and deterministic route keys from it (see `getRouteKey`).
  // `undefined` at the root container, which yields the `navigator` sentinel state key.
  const parentRouteKey = route?.key;

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

  const router = useLazyValue<InternalRouter<State, any>>(() => {
    if (
      rest.initialRouteName != null &&
      routeConfigs.every((config) => config.props.name !== rest.initialRouteName)
    ) {
      throw new Error(
        `Couldn't find a screen named '${rest.initialRouteName}' to use as 'initialRouteName'.`
      );
    }

    const original = createRouter(rest as unknown as RouterOptions) as InternalRouter<State, any>;

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
  const routeKeyList = routeNames.reduce<Record<string, React.Key | undefined>>((acc, curr) => {
    acc[curr] = screens[curr]!.keys.map((key) => key ?? '').join(':');
    return acc;
  }, {});
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

  const isStateInitialized = React.useCallback(
    <T extends NavigationState>(state: T | PartialState<T> | undefined): state is T =>
      state !== undefined && state.stale === false,
    []
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
  } = use(NavigationStateContext);

  const stateCleanupRef = React.useRef<boolean>(false);
  const lastStateRef = React.useRef<State | PartialState<State> | undefined>(undefined);

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
    if (stateCleanupRef.current && lastStateRef.current) {
      const state: State = isStateInitialized(lastStateRef.current)
        ? lastStateRef.current
        : router.getRehydratedState(lastStateRef.current, {
            routeNames,
            parentRouteKey,
            routeParamList,
            routeGetIdList,
          });

      return [undefined, state, false, undefined];
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
      currentState === undefined &&
      route?.params?.state == null &&
      !(typeof route?.params?.screen === 'string' && route?.params?.initial !== false) &&
      !isNestedParamsConsumed
    ) {
      return [
        undefined,
        router.getInitialState({
          routeNames,
          parentRouteKey,
          routeParamList: initialRouteParamList,
          routeGetIdList,
        }),
        true,
        undefined,
      ];
    } else {
      const paramsForState = isNestedParamsConsumed ? undefined : route?.params;
      const stateFromParams = paramsForState ? getStateFromParams(paramsForState) : undefined;

      const stateBeforeInitialization = (stateFromParams ?? currentState) as
        | PartialState<State>
        | undefined;

      const hydratedState =
        stateBeforeInitialization == null
          ? router.getInitialState({
              routeNames,
              parentRouteKey,
              routeParamList: initialRouteParamList,
              routeGetIdList,
            })
          : router.getRehydratedState(stateBeforeInitialization, {
              routeNames,
              parentRouteKey,
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
  }, [currentState, router]);

  const previousRouteKeyListRef = React.useRef(routeKeyList);
  const previousRouteKeyList = previousRouteKeyListRef.current;
  const routeKeyChanges = Object.keys(routeKeyList).filter(
    (name) => name in previousRouteKeyList && routeKeyList[name] !== previousRouteKeyList[name]
  );

  const [unhandledState, setUnhandledState] = React.useState<
    NavigationState | PartialState<NavigationState> | undefined
  >(stateBeforeInitialization);
  const unhandledStateRef = React.useRef<
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
    unhandledStateRef.current = stateBeforeInitialization;
    setUnhandledState(stateBeforeInitialization);
  }

  const contextState =
    // If the state isn't initialized, or stale, use the state we initialized instead
    // The state won't update until there's a change needed in the state we have initialized locally
    // So it'll be `undefined` or stale until the first navigation event happens
    isStateInitialized(currentState) ? (currentState as State) : (initializedState as State);

  const storeSlice = useStoreSlice(contextState?.key);
  let state = (storeSlice ?? contextState) as State;

  let nextState: State = state;

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
          unhandledStateRef.current = route.params.state;
          setUnhandledState(route.params.state);
        }
      } else {
        // If the route was updated with new state, we should reset to it
        action = CommonActions.reset(route.params.state);
      }
    } else if (
      typeof route.params.screen === 'string' &&
      ((route.params.initial === false && isFirstStateInitialization) || !isNestedParamsConsumed)
    ) {
      didConsumeNestedParams = true;

      if (
        options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
        !routeNames.includes(route.params.screen)
      ) {
        const state = getStateFromParams(route.params);

        if (state != null && !deepEqual(state, unhandledState)) {
          unhandledStateRef.current = state;
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
          parentRouteKey,
          routeParamList,
          routeGetIdList,
        })
      : null;

    nextState =
      updatedState !== null
        ? router.getRehydratedState(updatedState, {
            routeNames,
            parentRouteKey,
            routeParamList,
            routeGetIdList,
          })
        : nextState;
  }

  React.useEffect(() => {
    if (didConsumeNestedParams && typeof route?.params === 'object' && route.params != null) {
      // Track whether the params have been already consumed
      // Set it to the same object, so merged params can be handled again
      Object.defineProperty(route.params, CONSUMED_PARAMS, {
        value: route.params,
        enumerable: false,
      });
    }
  }, [didConsumeNestedParams, route?.params]);

  const shouldUpdate = state !== nextState;

  useClientLayoutEffect(() => {
    if (shouldUpdate) {
      setState(nextState);
    }
  });

  // The up-to-date state will come in next render, but we don't need to wait for it
  // We can't use the outdated state since the screens have changed, which will cause error due to mismatched config
  // So we override the state object we return to use the latest state as soon as possible
  state = nextState;
  const reconciliationState = state;
  state = getStateForRenderableRoutes(
    state,
    routeNames,
    routeKeyChanges,
    rest.initialRouteName,
    routeParamList
  );

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

  const getState = useLatestCallback((): State => {
    const currentState = getCurrentState();

    return deepFreeze(
      (isStateInitialized(currentState) ? currentState : initializedState) as State
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
      routeNames.push(...Object.keys(screens).filter((name) => route?.name === name));
    }

    if (route == null) {
      return;
    }

    const navigation = descriptors[route.key]!.navigation;

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
    emitter.emit({ type: 'state', data: { state } });
  }, [emitter, state]);

  const { listeners: childListeners, addListener } = useChildListeners();

  const { keyedListeners, addKeyedListener } = useKeyedChildListeners();

  const routerConfigOptions: RouterConfigOptions = {
    routeNames,
    parentRouteKey,
    routeParamList,
    routeGetIdList,
  };

  const latestConfigRef = React.useRef(routerConfigOptions);

  useClientLayoutEffect(() => {
    latestConfigRef.current = routerConfigOptions;
  });

  const { dispatchRoot } = use(NavigationBuilderContext);
  const needsRouteNamesReconcile =
    !isArrayEqual(reconciliationState.routeNames, routeNames) ||
    !isRecordEqual(routeKeyList, previousRouteKeyList);
  const pendingUnhandledState = unhandledStateRef.current ?? unhandledState;
  const shouldRestoreUnhandledState =
    options.UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled' &&
    pendingUnhandledState?.routes.every((r) => routeNames.includes(r.name)) &&
    reconciliationState?.routes.every((r) => !routeNames.includes(r.name));

  const onUnhandledActionParent = use(UnhandledActionContext);
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
              'path' in action.payload && typeof action.payload.path === 'string'
                ? action.payload.path
                : undefined,
          },
        ],
      };

      unhandledStateRef.current = state;
      setUnhandledState(state);
    }

    onUnhandledActionParent?.(action);
  });

  const reducerRegistry = use(ReducerRegistryContext);
  const registryReducer = React.useCallback<NavigationReducer>(
    (state, action) => {
      if (isReconcileRouteNamesAction(action)) {
        if (action.target !== state.key) {
          return null;
        }

        const config = action.payload;
        const nextState =
          config.unhandledState != null &&
          config.unhandledState.routes.every((r) => config.routeNames.includes(r.name)) &&
          state.routes.every((r) => !config.routeNames.includes(r.name))
            ? router.getRehydratedState(config.unhandledState as PartialState<State>, config)
            : router.getStateForRouteNamesChange(state as State, config);

        return router.getRehydratedState(nextState, config) as ReturnType<NavigationReducer>;
      }

      const nextState = router.getStateForAction(state as State, action, latestConfigRef.current);

      if (nextState == null || nextState.stale === false) {
        return nextState as ReturnType<NavigationReducer>;
      }

      return router.getRehydratedState(
        nextState,
        latestConfigRef.current
      ) as ReturnType<NavigationReducer>;
    },
    [router]
  );
  const registryEntry = React.useMemo<NavigatorRegistryEntry>(
    () => ({
      reduce: registryReducer,
      focusRoute: (state, routeKey) => router.getStateForRouteFocus(state as State, routeKey),
      shouldActionChangeFocus: router.shouldActionChangeFocus,
      shouldPreventRemove: (currentState, nextState, action) =>
        shouldPreventRemove(
          emitter,
          keyedListeners.beforeRemove,
          currentState.routes,
          nextState.routes,
          action
        ),
      onUnhandledAction,
    }),
    [emitter, keyedListeners.beforeRemove, onUnhandledAction, registryReducer, router]
  );
  const backBehavior = (rest as { backBehavior?: unknown }).backBehavior;

  useClientInsertionEffect(() => {
    reducerRegistry?.addEntry(state.key, registryEntry);

    return () => {
      reducerRegistry?.removeEntry(state.key, registryEntry);
    };
  }, [backBehavior, reducerRegistry, registryEntry, state.key]);

  useClientLayoutEffect(() => {
    if (!needsRouteNamesReconcile && !shouldRestoreUnhandledState) {
      previousRouteKeyListRef.current = routeKeyList;
      return;
    }

    const handled = dispatchRoot?.(
      {
        type: RECONCILE_ROUTE_NAMES,
        target: reconciliationState.key,
        payload: {
          routeNames,
          parentRouteKey,
          routeParamList,
          routeGetIdList,
          routeKeyChanges,
          unhandledState: shouldRestoreUnhandledState ? pendingUnhandledState : undefined,
        },
      },
      {
        originKey: reconciliationState.key,
        skipBeforeRemove: true,
        suppressUnhandled: true,
      }
    );

    if (handled) {
      previousRouteKeyListRef.current = routeKeyList;

      if (shouldRestoreUnhandledState) {
        unhandledStateRef.current = undefined;
        setUnhandledState(undefined);
      }
    }
  });

  useOnPreventRemove({
    getState,
    emitter,
    beforeRemoveListeners: keyedListeners.beforeRemove,
  });

  const onAction = useLatestCallback((action: NavigationAction) => {
    const handled =
      dispatchRoot?.(action, {
        originKey: state.key,
        suppressUnhandled: true,
      }) ?? false;

    if (handled) {
      return true;
    }

    if (action.type === 'PRELOAD' || action.target == null || action.target === state.key) {
      const result = router.getStateForAction(state, action, latestConfigRef.current);

      if (result != null && result !== state) {
        const isPrevented = shouldPreventRemove(
          emitter,
          keyedListeners.beforeRemove,
          state.routes,
          result.routes,
          action
        );

        if (!isPrevented) {
          setState(result);
        }
      }

      return result != null;
    }

    return false;
  });

  const onRouteFocus = useLatestCallback((key: string) => {
    const result = router.getStateForRouteFocus(state, key);

    if (result !== state) {
      setState(result);
    }
  });

  const navigation = useNavigationHelpers<State, ActionHelpers, NavigationAction, EventMap>({
    id: options.id,
    onAction,
    onUnhandledAction,
    getState,
    emitter,
    router,
    dispatchRoot,
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
            <FocusedRouteKeyContext.Provider value={state.routes[state.index]!.key}>
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
