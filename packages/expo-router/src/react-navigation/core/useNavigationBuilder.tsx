'use client';
import * as React from 'react';
import { use } from 'react';
// TODO(@ubax) - RN Migration: remove this dependency and just add this function to our codebase
import { isValidElementType } from 'react-is';

import {
  type NavigationReducer,
  NavigationSyncStateContext,
  type NavigatorRegistryEntry,
  ReducerRegistryContext,
} from '../../global-state/storeContext';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  type DefaultRouterOptions,
  type InternalRouter,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  RECONCILE_ROUTE_NAMES,
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
import { shouldPreventRemove, useOnPreventRemove } from './useOnPreventRemove';
import { useRegisterNavigator } from './useRegisterNavigator';
import { getCachedSlice, useStoreSlice } from './useStoreSlice';

// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;

type NavigatorRoute = {
  key: string;
  params?: NavigatorScreenParams<ParamListBase>;
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

  const { state: currentState, setKey } = use(NavigationStateContext);

  // The committed store is the single source of truth. The parent (or the container) hands this
  // navigator its committed slice as `currentState`; we take the slice key from it and subscribe to
  // that slice in the store directly (see `state` below), so a change to this navigator's slice
  // re-renders it even when an ancestor is memoized. There is no compose-up — the root reducer is
  // the only writer, and a navigator whose slice isn't committed yet seeds its own initial state
  // into the store (see the self-seed effect below).
  const store = use(NavigationSyncStateContext);

  if (store == null) {
    throw new Error("Couldn't find a navigation store. Is your component inside a navigator?");
  }

  // This navigator's initial state, computed ONLY when its slice isn't committed yet — an
  // unvisited/preloaded nested navigator, or a container mounted without a compiler seed. It seeds
  // the store (see the self-seed effect) and renders until the seed lands. When the slice is already
  // committed (the compiler seeded it, or a dispatch created it) this stays `undefined` so
  // `getInitialState` is never called on the seeded path.
  const isCommitted = currentState != null;
  const initialState = React.useMemo(
    () =>
      isCommitted
        ? undefined
        : (router.getInitialState({
            routeNames,
            parentRouteKey,
            routeParamList,
            routeGetIdList,
          }) as State),
    // Recomputes when committed-ness flips or the router changes; routeNames/param changes are
    // reconciled through the store, not by recomputing the seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCommitted, router]
  );

  const key = currentState?.key ?? initialState?.key;

  const previousRouteKeyListRef = React.useRef(routeKeyList);
  const previousRouteKeyList = previousRouteKeyListRef.current;
  const routeKeyChanges = Object.keys(routeKeyList).filter(
    (name) => name in previousRouteKeyList && routeKeyList[name] !== previousRouteKeyList[name]
  );

  // An unhandled state is a captured NAVIGATE/RESET target whose routes were all invalid for this
  // navigator (see `onUnhandledAction` below). We store it so `lastUnhandled` can restore it once
  // the route names change to include those routes.
  const [unhandledState, setUnhandledState] = React.useState<
    NavigationState | PartialState<NavigationState> | undefined
  >(undefined);
  const unhandledStateRef = React.useRef<
    NavigationState | PartialState<NavigationState> | undefined
  >(undefined);

  const storeSlice = useStoreSlice(key);
  // Prefer the subscribed store slice. Fall back to the slice the parent handed down (covers a
  // committed navigator whose subscription hasn't observed the latest commit yet), then to the
  // initial state for a navigator that isn't committed at all (it seeds itself below).
  let state = (storeSlice ?? currentState ?? initialState) as State;

  const reconciliationState = state;
  state = getStateForRenderableRoutes(
    state,
    routeNames,
    routeKeyChanges,
    rest.initialRouteName,
    routeParamList
  );

  // The last committed slice this navigator rendered. `getState` reads the live slice from the
  // store by key, but during a transition (deep link, a slice briefly re-keyed) that lookup can
  // come back empty for a beat; fall back to what we last rendered so imperative reads never see
  // `undefined`.
  const lastCommittedStateRef = React.useRef(reconciliationState);
  React.useEffect(() => {
    lastCommittedStateRef.current = reconciliationState;
  });

  React.useEffect(() => {
    setKey(navigatorKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getState = useLatestCallback((): State => {
    const slice = key == null ? undefined : getCachedSlice(store.getState(), key);
    return deepFreeze((slice ?? lastCommittedStateRef.current) as State);
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

  const { dispatchRoot, seedNavigatorState } = use(NavigationBuilderContext);
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
    (state, action) =>
      router.getStateForAction(
        state as State,
        action,
        latestConfigRef.current
      ) as ReturnType<NavigationReducer>,
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

  // Seed this navigator's slice into the store when it isn't committed yet — the root container
  // with no compiler seed, or an unvisited/preloaded nested navigator whose parent route carries no
  // `state`. Idempotent: it only writes when the slice is absent, so once committed (here, by the
  // compiler, or by a dispatch) it never runs again. This is the sole path by which a navigator's
  // initial state reaches the store; there is no render-time compose-up.
  useClientLayoutEffect(() => {
    if (storeSlice == null && initialState != null) {
      seedNavigatorState?.(parentRouteKey, initialState as NavigationState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlice, parentRouteKey, initialState, seedNavigatorState]);

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
    // Forward to the container's root reducer, tagged with this navigator's key. The old local
    // reducer escape hatch is gone — the store is the only writer.
    return (
      dispatchRoot?.(action, {
        originKey: state.key,
        suppressUnhandled: true,
      }) ?? false
    );
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

  const { describe, descriptors } = useDescriptors<State, ActionHelpers, ScreenOptions, EventMap>({
    state,
    screens,
    navigation,
    screenOptions,
    screenLayout,
    onAction,
    getState,
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
