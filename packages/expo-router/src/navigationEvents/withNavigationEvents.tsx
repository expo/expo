'use client';

import type { ComponentType, RefObject } from 'react';
import { forwardRef, useMemo, useRef } from 'react';

import { emit, unstable_navigationEvents } from './index';
import { generateStringUrlForState, getPathAndParamsFromStringUrl } from './utils';
import type {
  EventMapBase,
  NavigationProp,
  ParamListBase,
  RouteProp,
  ScreenListeners,
  NavigationState,
} from '../react-navigation/native';
import { useStateForPath } from '../react-navigation/native';
import type { NativeStackNavigationEventMap } from '../react-navigation/native-stack';

type AnyNavigatorFactory = (config?: any) => {
  Navigator: ComponentType<any>;
  Screen: ComponentType<any>;
  Group: ComponentType<any>;
};

// TODO(@ubax): move this type into navigator types
type ScreenListenersInput<TState extends NavigationState, TEventMap extends EventMapBase> =
  | ScreenListeners<TState, TEventMap>
  | ((props: {
      route: RouteProp<ParamListBase, string>;
      navigation: ScreenNavigation;
    }) => ScreenListeners<TState, TEventMap>);

type ScreenNavigation = NavigationProp<ParamListBase>;

type ObservedScreenListeners = ScreenListeners<
  NavigationState,
  Pick<NativeStackNavigationEventMap, 'transitionStart' | 'transitionEnd'>
>;

type StackListenerMap = Required<
  Pick<ObservedScreenListeners, 'transitionStart' | 'transitionEnd'>
>;
type TabListenerMap = Required<Pick<ObservedScreenListeners, 'focus' | 'blur'>>;

type FocusedRouteState = {
  routes: [
    {
      key?: string;
      name: string;
      params?: object;
      path?: string;
      state?: FocusedRouteState;
    },
  ];
};

// TODO(@ubax): extract this function to common util for SceneView and this component
/**
 * Append a route to the innermost level of `parent`. Mirrors how
 * SceneView builds the focused-route state when entering a child navigator.
 *
 * @internal Exposed for unit testing only.
 */
export function appendRouteToFocusedState(
  parent: FocusedRouteState | undefined,
  route: RouteProp<ParamListBase, string>
): FocusedRouteState {
  const leaf = buildLeafFromRoute({
    key: route.key,
    name: route.name,
    params: route.params,
    path: (route as { path?: string }).path,
  });

  const addState = (current: FocusedRouteState | undefined): FocusedRouteState => {
    if (!current) return leaf;
    const head = current.routes[0];
    return {
      routes: [{ ...head, state: addState(head.state) }],
    };
  };

  return addState(parent);
}

// Recursively expands `{ screen, params }` params into nested `state`, and
// strips the `screen`/`params` keys from the parent's own params.
function buildLeafFromRoute(route: {
  key?: string;
  name: string;
  params?: object;
  path?: string;
}): FocusedRouteState {
  const params = route.params as
    | { screen?: unknown; params?: object; [key: string]: unknown }
    | undefined;

  if (params && typeof params.screen === 'string') {
    const { screen: nestedScreen, params: nestedParams, ...ownParams } = params;
    return {
      routes: [
        {
          key: route.key,
          name: route.name,
          params: Object.keys(ownParams).length > 0 ? ownParams : undefined,
          path: route.path,
          state: buildLeafFromRoute({
            name: nestedScreen,
            params: nestedParams,
          }),
        },
      ],
    };
  }

  return {
    routes: [
      {
        key: route.key,
        name: route.name,
        params: route.params,
        path: route.path,
      },
    ],
  };
}

function emitFor(
  type: 'pageWillAppear' | 'pageAppeared' | 'pageWillDisappear' | 'pageDisappeared',
  parentStateForPath: FocusedRouteState | undefined,
  route: RouteProp<ParamListBase, string>
) {
  const composed = appendRouteToFocusedState(parentStateForPath, route);
  const stringUrl = generateStringUrlForState(composed);
  if (!stringUrl) return;
  emit(type, {
    ...getPathAndParamsFromStringUrl(stringUrl),
    screenId: route.key,
  });
}

/**
 * @internal Exposed for unit testing only.
 */
export function mergeListeners(
  theirs: ScreenListenersInput<NavigationState, EventMapBase> | undefined,
  ours: ObservedScreenListeners
) {
  return ({
    route,
    navigation,
  }: {
    route: RouteProp<ParamListBase, string>;
    navigation: ScreenNavigation;
  }): ObservedScreenListeners => {
    const user: ObservedScreenListeners =
      typeof theirs === 'function' ? theirs({ route, navigation }) : (theirs ?? {});
    const merged: ObservedScreenListeners = { ...user };

    for (const key of Object.keys(ours) as (keyof ObservedScreenListeners)[]) {
      const userFn = user[key];
      const ourFn = ours[key];
      // Already assigned via spread above
      if (!ourFn) continue;
      const combined: typeof ourFn = userFn
        ? (e: any) => {
            userFn(e);
            ourFn(e);
          }
        : ourFn;
      (merged[key] as typeof ourFn) = combined;
    }
    return merged;
  };
}

/**
 * @internal Exposed for unit testing only.
 */
export function buildStackListeners(
  parentStateForPathRef: RefObject<FocusedRouteState | undefined>,
  route: RouteProp<ParamListBase, string>
): StackListenerMap {
  const callbacks: StackListenerMap = {
    transitionStart: (e) => {
      if (!unstable_navigationEvents.isEnabled()) return;
      const type = e?.data?.closing ? 'pageWillDisappear' : 'pageWillAppear';
      emitFor(type, parentStateForPathRef.current, route);
    },
    transitionEnd: (e) => {
      if (!unstable_navigationEvents.isEnabled()) return;
      const type = e?.data?.closing ? 'pageDisappeared' : 'pageAppeared';
      emitFor(type, parentStateForPathRef.current, route);
    },
  };
  return callbacks;
}

/**
 * @internal Exposed for unit testing only.
 */
export function buildTabListeners(
  parentStateForPathRef: RefObject<FocusedRouteState | undefined>,
  route: RouteProp<ParamListBase, string>
): TabListenerMap {
  const callbacks: TabListenerMap = {
    focus: () => {
      if (!unstable_navigationEvents.isEnabled()) return;
      emitFor('pageAppeared', parentStateForPathRef.current, route);
    },
    blur: () => {
      if (!unstable_navigationEvents.isEnabled()) return;
      emitFor('pageDisappeared', parentStateForPathRef.current, route);
    },
  };
  return callbacks;
}

/**
 * @internal Exposed for unit testing only.
 */
export function buildScreenListeners(
  mode: 'stack' | 'tab',
  parentStateForPathRef: RefObject<FocusedRouteState | undefined>,
  userScreenListeners: ScreenListenersInput<NavigationState, EventMapBase> | undefined
) {
  return ({
    route,
    navigation,
  }: {
    route: RouteProp<ParamListBase, string>;
    navigation: ScreenNavigation;
  }): ObservedScreenListeners => {
    const ours: ObservedScreenListeners =
      mode === 'stack'
        ? buildStackListeners(parentStateForPathRef, route)
        : buildTabListeners(parentStateForPathRef, route);

    return mergeListeners(userScreenListeners, ours)({ route, navigation });
  };
}

interface NavigationEventsNavigatorProps {
  screenListeners?: ScreenListenersInput<NavigationState, EventMapBase>;
}

function makeWithNavigationEvents(mode: 'stack' | 'tab') {
  return function withNav<F extends AnyNavigatorFactory>(create: F): F {
    const wrappedFactory: AnyNavigatorFactory = (config?: Parameters<F>[0]) => {
      const factory = create(config);
      const Original = factory.Navigator;

      const Wrapped = forwardRef<unknown, NavigationEventsNavigatorProps>(
        function NavigationEventsNavigator({ screenListeners: userScreenListeners, ...rest }, ref) {
          // Snapshot the navigation state above this navigator. Each screen's
          // path is computed lazily inside the listener by appending its route
          // to this snapshot. The ref keeps screenListeners' identity stable
          // across parent re-renders so React Navigation does not re-attach
          // listeners on every navigation tick.
          const parentStateForPath = useStateForPath() as FocusedRouteState | undefined;
          const parentStateForPathRef = useRef<FocusedRouteState | undefined>(parentStateForPath);
          parentStateForPathRef.current = parentStateForPath;

          const screenListeners = useMemo(
            () => buildScreenListeners(mode, parentStateForPathRef, userScreenListeners),
            [userScreenListeners]
          );

          return <Original {...rest} ref={ref} screenListeners={screenListeners} />;
        }
      );

      return { ...factory, Navigator: Wrapped as unknown as typeof Original };
    };

    return wrappedFactory as F;
  };
}

/**
 * Wraps a stack-style React Navigation factory so every screen rendered by it
 * emits `pageWillAppear`/`pageAppeared`/`pageWillDisappear`/`pageDisappeared`
 * via `unstable_navigationEvents` based on `transitionStart`/`transitionEnd`.
 */
export const withNavigationEvents = makeWithNavigationEvents('stack');

/**
 * Wraps a tab/drawer React Navigation factory so every screen emits only
 * `pageAppeared` (on focus) and `pageDisappeared` (on blur).
 */
export const withTabNavigationEvents = makeWithNavigationEvents('tab');
