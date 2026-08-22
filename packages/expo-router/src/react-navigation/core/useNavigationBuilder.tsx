'use client';
import * as React from 'react';
import { use } from 'react';
// TODO(@ubax) - RN Migration: remove this dependency and just add this function to our codebase
import { isValidElementType } from 'react-is';

import { useRouteNode } from '../../Route';
import { useComponent } from '../../fork/useComponent';
import { type RouterRegistryEntry, useRegisterRouter } from '../../global-state/routerRegistry';
import { routingQueue } from '../../global-state/routingQueue';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  type DefaultRouterOptions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type Route,
  type Router,
  type RouterConfigOptions,
  type RouterFactory,
} from '../routers';
import { Group } from './Group';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationHelpersContext } from './NavigationHelpersContext';
import { NavigationMetaContext } from './NavigationMetaContext';
import { NavigationStateContext } from './NavigationStateContext';
import { NavigatorTypeContext } from './NavigatorTypeContext';
import { PreventRemoveContext } from './PreventRemoveContext';
import { Screen } from './Screen';
import { isArrayEqual } from './isArrayEqual';
import {
  type DefaultNavigatorOptions,
  type DescriptorRouteProp,
  type EventMapBase,
  type EventMapCore,
  PrivateValueStore,
  type RouteConfig,
} from './types';
import { useChildListeners } from './useChildListeners';
import { useClientLayoutEffect } from './useClientLayoutEffect';
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
import {
  emitBeforeRemove,
  getPreventableRoutes,
  shouldPreventRemove,
  useOnPreventRemove,
} from './useOnPreventRemove';
import { usePreventRemoveState } from './usePreventRemoveState';
import { useRegisterNavigator } from './useRegisterNavigator';

// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;

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
  useRegisterNavigator();
  const routeNode = useRouteNode();

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
    (state: NavigationState | PartialState<NavigationState>) =>
      state.type === undefined || state.type === router.type,
    [router.type]
  );

  const { state: currentState } = use(NavigationStateContext);

  const { getStateForKey, handleAction } = use(NavigationBuilderContext);
  if (
    currentState === undefined ||
    currentState.stale !== false ||
    typeof currentState.key !== 'string' ||
    !Array.isArray(currentState.routeNames) ||
    !isStateValid(currentState)
  ) {
    throw new Error(
      'A navigator received a missing, partial, or incompatible navigation state. Navigation state is created globally now, so the container must provide a complete seeded state for every mounted navigator.'
    );
  }

  const committedState = currentState as State;
  const state = router.getStateForDeclaredRoutes(committedState, routeNames);
  // TODO(@ubax): Check whether this ref can be safely removed.
  const stateKeyRef = React.useRef(committedState.key);

  React.useInsertionEffect(() => {
    stateKeyRef.current = committedState.key;
  });

  // TODO(@ubax): find a better way to implement this then ref approach
  const registryConfigRef = React.useRef({ routeNames, routeGetIdList });
  React.useInsertionEffect(() => {
    registryConfigRef.current = { routeNames, routeGetIdList };
  });
  // Screen-list changes invalidate render consumers even though the reducer reads committed config.
  const routeNamesKey = routeNames.join('\0');
  const reduce = React.useCallback<RouterRegistryEntry['reduce']>(
    (registryState, action) =>
      // The registry stores states from different router types; this entry only receives its own state key.
      router.getStateForAction(registryState as State, action, {
        routeNames: registryConfigRef.current.routeNames,
        routeGetIdList: registryConfigRef.current.routeGetIdList,
      }),
    [routeNamesKey, router]
  );
  const getState = useLatestCallback((): State => {
    const currentState = getStateForKey(stateKeyRef.current);
    if (currentState === undefined) {
      return committedState;
    }
    if (currentState.stale !== false || !isStateValid(currentState)) {
      throw new Error(
        'The mounted navigator no longer has a complete compatible state in the global navigation tree.'
      );
    }
    return currentState as State;
  });
  const emitter = useEventEmitter<EventMapCore<State>>((e) => {
    const routeNames = [];

    let route: Route<string> | undefined;
    let isPlaceholder = false;

    if (e.target) {
      route = state.routes.find((route) => route.key === e.target);
      const config = screens[e.target];

      if (!route && config) {
        route = { key: e.target, name: e.target };
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
    emitter.emit({ type: 'state', data: { state } });
  }, [emitter, state]);

  const { listeners: childListeners, addListener } = useChildListeners();

  const { keyedListeners, addKeyedListener } = useKeyedChildListeners();

  const { isRoutePrevented, preventRemoveContextValue } = usePreventRemoveState({
    getState,
    state,
  });

  useOnPreventRemove({
    getState,
    isRoutePrevented,
    emitter,
    preventRemoveListeners: keyedListeners.preventRemove,
    beforeRemoveListeners: keyedListeners.beforeRemove,
  });

  const onAction = React.useCallback(
    (action: NavigationAction) => handleAction(action, stateKeyRef.current),
    [handleAction]
  );

  const registryEntry = React.useMemo<RouterRegistryEntry>(
    () => ({
      reduce,
      shouldActionChangeFocus: router.shouldActionChangeFocus,
      getStateForRouteFocus: (registryState, routeKey) =>
        router.getStateForRouteFocus(registryState as State, routeKey),
      shouldPreventRemove: (prev, next, action) =>
        shouldPreventRemove(
          emitter,
          keyedListeners.preventRemove,
          isRoutePrevented,
          getPreventableRoutes(prev),
          getPreventableRoutes(next, prev.type),
          action
        ),
      emitBeforeRemove: (prev, next, action) =>
        emitBeforeRemove(
          emitter,
          keyedListeners.beforeRemove,
          getPreventableRoutes(prev),
          getPreventableRoutes(next, prev.type),
          action
        ),
      routeNode: routeNode ?? undefined,
    }),
    [emitter, isRoutePrevented, keyedListeners, reduce, routeNode, routeNamesKey, router]
  );

  useRegisterRouter(committedState.key, registryEntry);

  useClientLayoutEffect(() => {
    const committed = getState();

    if (!isArrayEqual(committed.routeNames, routeNames)) {
      // TODO(@ubax): rework the HMR logic after the global state is merged.
      routingQueue.add({
        type: 'ACTION',
        payload: {
          action: {
            type: 'ROUTE_NAMES_CHANGED',
            payload: { routeNames },
            target: committed.key,
          },
          originKey: committed.key,
        },
      });
    }
  });

  const navigation = useNavigationHelpers<State, ActionHelpers, NavigationAction, EventMap>({
    id: options.id,
    handleAction: onAction,
    getState,
    emitter,
    router,
  });

  useFocusedListenersChildrenAdapter({
    navigation,
    focusedListeners: childListeners.focus,
  });

  const { describe, descriptors } = useDescriptors<State, ActionHelpers, ScreenOptions, EventMap>({
    routes: state.routes,
    routeNames: state.routeNames,
    screens,
    navigation,
    screenOptions,
    screenLayout,
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
            <FocusedRouteKeyContext.Provider value={state.routes[state.index]?.key}>
              <PreventRemoveContext.Provider value={preventRemoveContextValue}>
                <NavigatorTypeContext.Provider value={router.type}>
                  {element}
                </NavigatorTypeContext.Provider>
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
