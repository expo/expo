'use client';
import * as React from 'react';
import { use } from 'react';

import type { NavigationState, ParamListBase, PartialState, Route } from '../routers';
import { EnsureSingleNavigator } from './EnsureSingleNavigator';
import {
  type FocusedRouteState,
  NavigationFocusedRouteStateContext,
} from './NavigationFocusedRouteStateContext';
import { NavigationStateContext } from './NavigationStateContext';
import { StaticContainer } from './StaticContainer';
import type { NavigationProp, RouteConfigComponent } from './types';
import { useOptionsGetters } from './useOptionsGetters';

type Props<State extends NavigationState, ScreenOptions extends object> = {
  screen: RouteConfigComponent<ParamListBase, string> & { name: string };
  navigation: NavigationProp<ParamListBase, string, string | undefined, State, ScreenOptions>;
  route: Route<string>;
  routeState: NavigationState | PartialState<NavigationState> | undefined;
  getState: () => State;
  options: object;
  clearOptions: () => void;
};

/**
 * Component which takes care of rendering the screen for a route.
 * It provides all required contexts and applies optimizations when applicable.
 */
function SceneViewImpl<State extends NavigationState, ScreenOptions extends object>({
  screen,
  route,
  navigation,
  routeState,
  getState,
  options,
  clearOptions,
}: Props<State, ScreenOptions>) {
  const navigatorKeyRef = React.useRef<string | undefined>(undefined);
  const getKey = React.useCallback(() => navigatorKeyRef.current, []);

  const { addOptionsGetter } = useOptionsGetters({
    key: route.key,
    options,
    navigation,
  });

  const setKey = React.useCallback((key: string) => {
    navigatorKeyRef.current = key;
  }, []);

  const getCurrentState = React.useCallback(() => {
    const state = getState();
    const currentRoute = state.routes.find((r) => r.key === route.key);

    return currentRoute ? currentRoute.state : undefined;
  }, [getState, route.key]);

  const isInitialRef = React.useRef(true);

  React.useEffect(() => {
    isInitialRef.current = false;
  });

  // Clear options set by this screen when it is unmounted
  React.useEffect(() => {
    return clearOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIsInitial = React.useCallback(() => isInitialRef.current, []);

  const parentFocusedRouteState = use(NavigationFocusedRouteStateContext);

  const focusedRouteState = React.useMemo(() => {
    const state: FocusedRouteState = {
      routes: [
        {
          key: route.key,
          name: route.name,
          params: route.params,
        },
      ],
    };

    // Add our state to the innermost route of the parent state
    const addState = (parent: FocusedRouteState | undefined): FocusedRouteState => {
      const parentRoute = parent?.routes[0];

      if (parentRoute) {
        return {
          routes: [
            {
              ...parentRoute,
              state: addState(parentRoute.state),
            },
          ],
        };
      }

      return state;
    };

    return addState(parentFocusedRouteState);
  }, [parentFocusedRouteState, route.key, route.name, route.params]);

  const context = React.useMemo(
    () => ({
      state: routeState,
      getState: getCurrentState,
      getKey,
      setKey,
      getIsInitial,
      addOptionsGetter,
    }),
    [routeState, getCurrentState, getKey, setKey, getIsInitial, addOptionsGetter]
  );

  const ScreenComponent = screen.getComponent ? screen.getComponent() : screen.component;

  return (
    <NavigationStateContext.Provider value={context}>
      <NavigationFocusedRouteStateContext.Provider value={focusedRouteState}>
        <EnsureSingleNavigator>
          <StaticContainer
            name={screen.name}
            render={ScreenComponent || screen.children}
            navigation={navigation}
            route={route}>
            {ScreenComponent !== undefined ? (
              <ScreenComponent navigation={navigation} route={route} />
            ) : screen.children !== undefined ? (
              screen.children({ navigation, route })
            ) : null}
          </StaticContainer>
        </EnsureSingleNavigator>
      </NavigationFocusedRouteStateContext.Provider>
    </NavigationStateContext.Provider>
  );
}

// Per-slice bail-out boundary (risk 3). Post the transitions flip, navigators render from a tree
// delivered via context, which bypasses `React.memo` — so without this boundary every navigator's
// `SceneView` re-runs on every root commit (the retired uSES subscription used to bail unchanged
// slices out). The root reducer keeps an unchanged child slice's `routeState` referentially stable
// (hardened by the reducer's no-op identity guarantee), so memoizing on `routeState` identity — plus
// the other identity-stable inputs and a shallow `options` compare (options churn a fresh object each
// parent render but only matter when their values change) — restores the bail-out: navigating one tab
// no longer re-renders the others' subtrees. `clearOptions` is a stable-behavior closure recreated
// each render; it is consumed only by an unmount effect and `useOptionsGetters`, so it is not a
// bail-out signal. `useIsFocused` stays correct because a focus change moves `state.index`, which
// changes `routeState` identity and re-renders the boundary.
function shallowEqualOptions(a: object, b: object): boolean {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a) as (keyof typeof a)[];
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => a[key] === (b as typeof a)[key]);
}

export const SceneView = React.memo(SceneViewImpl, (prev, next) => {
  // Only bail out for a route that hosts a nested navigator (a defined `routeState`) whose slice is
  // referentially unchanged — that is where the win is (a whole nested subtree skips re-rendering
  // when a sibling navigates). A LEAF route (`routeState == null`) must never bail: it has to
  // re-render when it gains/loses focus (its `<Stack.Screen>` options, `useIsFocused`, focus effects
  // all depend on a focus change that does not alter its own — empty — `routeState`). Leaves are
  // cheap; the budget the memo protects is the deep nested subtrees.
  if (prev.routeState == null || next.routeState == null) {
    return false;
  }
  return (
    prev.routeState === next.routeState &&
    prev.route === next.route &&
    prev.screen === next.screen &&
    prev.navigation === next.navigation &&
    prev.getState === next.getState &&
    shallowEqualOptions(prev.options, next.options)
  );
}) as typeof SceneViewImpl;
