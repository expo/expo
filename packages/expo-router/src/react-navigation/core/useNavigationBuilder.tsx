'use client';
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
  type DefaultRouterOptions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  RECONCILE_ROUTE_NAMES,
  type Route,
  type Router,
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
import { Screen } from './Screen';
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
import { useLazyValue } from './useLazyValue';
import { useNavigationHelpers } from './useNavigationHelpers';
import { NavigationStateListenerProvider } from './useNavigationState';
import { useRegisterNavigator } from './useRegisterNavigator';

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

  const router = useLazyValue<Router<State, any>>(() => {
    if (
      rest.initialRouteName != null &&
      routeConfigs.every((config) => config.props.name !== rest.initialRouteName)
    ) {
      throw new Error(
        `Couldn't find a screen named '${rest.initialRouteName}' to use as 'initialRouteName'.`
      );
    }

    const original = createRouter(rest as unknown as RouterOptions) as Router<State, any>;

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

  // The navigation tree lives in the container's root `useReducer`; each navigator renders from the
  // committed slice its parent hands down through `NavigationStateContext` (a `SceneView` provides
  // `state: routeState` for every child). The root reducer is the only writer, and every mounted
  // navigator's slice reaches the tree as a compiled subtree — the container seed for the focused
  // path, `payload.state` on a PRELOAD/navigate for the rest — so a mounted navigator always has a
  // handed slice. The per-slice bail-out that the retired uSES subscription used to give is restored
  // by the `React.memo` boundary at `SceneView` keyed on `routeState` identity.
  const key = currentState?.key;

  const reducerRegistry = use(ReducerRegistryContext);

  const previousRouteKeyListRef = React.useRef(routeKeyList);
  const previousRouteKeyList = previousRouteKeyListRef.current;
  // The declared key-list a `RECONCILE_ROUTE_NAMES` is currently in flight for, so the completion
  // effect doesn't re-dispatch the same reconcile every commit while its deferred reduction lands.
  const reconcileInFlightRef = React.useRef<Record<string, React.Key | undefined> | undefined>(
    undefined
  );
  const routeKeyChanges = Object.keys(routeKeyList).filter(
    (name) => name in previousRouteKeyList && routeKeyList[name] !== previousRouteKeyList[name]
  );

  let state = currentState as State;

  const reconciliationState = state;
  state = getStateForRenderableRoutes(
    state,
    routeNames,
    routeKeyChanges,
    rest.initialRouteName,
    routeParamList
  );

  // The last committed slice this navigator rendered, updated from a layout effect (commit time).
  // `getState` (the imperative navigator-state reader) returns it rather than the render value: a
  // speculative transition render must never be observed as committed. It is frozen only here, on
  // the committed value — never the in-flight `useReducer` render value.
  const lastCommittedStateRef = React.useRef(reconciliationState);
  useClientLayoutEffect(() => {
    lastCommittedStateRef.current = reconciliationState;
  });

  React.useEffect(() => {
    setKey(navigatorKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getState = useLatestCallback((): State => {
    return deepFreeze(lastCommittedStateRef.current as State);
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
  // The committed slice still carries route names / keys that differ from what this navigator now
  // declares (screens added/removed, a route's key changed): a `RECONCILE_ROUTE_NAMES` must run to
  // bring the committed slice in line. Under the `useReducer` flip the reconcile lands one commit
  // later (urgent dispatch, reduced at the next render) instead of synchronously.
  const committedReflectsDeclared = isArrayEqual(reconciliationState.routeNames, routeNames);
  const needsRouteNamesReconcile =
    !committedReflectsDeclared || !isRecordEqual(routeKeyList, previousRouteKeyList);
  // Invariant: the render-time projection only diverges from the committed slice while a route-names
  // reconciliation is unresolved. The tolerance spans the whole async window — from the render that
  // first needs a reconcile until the ref advances one commit after the reconcile commits.
  const reconcilePending =
    needsRouteNamesReconcile || !isRecordEqual(routeKeyList, previousRouteKeyListRef.current);
  if (process.env.NODE_ENV !== 'production' && state !== reconciliationState && !reconcilePending) {
    console.error(
      `Expo Router: render-time route projection for navigator ${key} diverged from its committed ` +
        `slice with no route-names reconciliation pending. The projection must stay identity outside ` +
        `a RECONCILE_ROUTE_NAMES window; please report this with the navigation you performed.`
    );
  }

  const registryReducer = React.useCallback<NavigationReducer>(
    (state, action) =>
      router.getStateForAction(
        state as State,
        action,
        latestConfigRef.current
      ) as ReturnType<NavigationReducer>,
    [router]
  );
  // TODO(prevent-remove): re-add a per-navigator `shouldPreventRemove` here when navigation
  // prevention is redesigned on the reducer model.
  const registryEntry = React.useMemo<NavigatorRegistryEntry>(
    () => ({
      reduce: registryReducer,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registryReducer, router]
  );
  const backBehavior = (rest as { backBehavior?: unknown }).backBehavior;

  useClientInsertionEffect(() => {
    reducerRegistry?.addEntry(state.key, registryEntry);

    return () => {
      reducerRegistry?.removeEntry(state.key, registryEntry);
    };
  }, [backBehavior, reducerRegistry, registryEntry, state.key]);

  useClientLayoutEffect(() => {
    // The completion signal that replaces the old synchronous `handled` read: reconciliation is done
    // once the committed slice reflects this navigator's declared route names (for a key-only change
    // the reconcile recreates the routes, so committed names still match declared afterward). Advance
    // the declared-key ref (monotonic — once observed it never un-advances, so an interrupted
    // transition regressing the handed slice for a beat can't flap it) and disarm the in-flight guard.
    if (committedReflectsDeclared) {
      previousRouteKeyListRef.current = routeKeyList;
      reconcileInFlightRef.current = undefined;
    }

    if (!needsRouteNamesReconcile) {
      return;
    }

    // Under the flip the reconcile reduces one commit later, so this effect re-runs (reconcile still
    // needed) before the reduction lands. Dispatch RECONCILE only once per distinct declared
    // key-list — re-dispatching every commit while the same reduction is in flight is the runaway
    // loop the async dispatch introduced. The guard is disarmed above once committed catches up, so a
    // genuinely new divergence re-arms it.
    if (
      reconcileInFlightRef.current != null &&
      isRecordEqual(reconcileInFlightRef.current, routeKeyList)
    ) {
      return;
    }
    reconcileInFlightRef.current = routeKeyList;

    // Route names/keys diverged from what's committed: reconcile urgently (internal bookkeeping, not
    // navigation — a transition would delay it behind a slow commit).
    dispatchRoot?.(
      {
        type: RECONCILE_ROUTE_NAMES,
        target: reconciliationState.key,
        payload: {
          routeNames,
          parentRouteKey,
          routeParamList,
          routeGetIdList,
          routeKeyChanges,
        },
      },
      {
        originKey: reconciliationState.key,
        urgent: true,
      }
    );
  });

  const onAction = useLatestCallback((action: NavigationAction) => {
    // Forward to the container's root reducer, tagged with this navigator's key. The old local
    // reducer escape hatch is gone — the root reducer is the only writer. Dispatch returns void now
    // (the verdict is eliminated); callers that asked "did this do anything" use the pure reducer.
    dispatchRoot?.(action, { originKey: state.key });
  });

  const navigation = useNavigationHelpers<State, ActionHelpers, NavigationAction, EventMap>({
    id: options.id,
    onAction,
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
            {/* TODO(prevent-remove): a navigation-prevention provider wrapped `element` here. */}
            <FocusedRouteKeyContext.Provider value={state.routes[state.index]!.key}>
              {element}
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
