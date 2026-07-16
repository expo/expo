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
export function SceneView<State extends NavigationState, ScreenOptions extends object>({
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

  // Nested navigators reduce through the container's root reducer (via `dispatchRoot`), so they no
  // longer patch their slice up into the parent's state here. The compose-up write is gone; this
  // stays a no-op only because the child navigator still reads `setState` off this context (removed
  // together with the context state reads in the store-slice step).
  const setCurrentState = React.useCallback(() => {}, []);

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
          path: route.path,
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
  }, [parentFocusedRouteState, route.key, route.name, route.params, route.path]);

  const context = React.useMemo(
    () => ({
      state: routeState,
      getState: getCurrentState,
      setState: setCurrentState,
      getKey,
      setKey,
      getIsInitial,
      addOptionsGetter,
    }),
    [routeState, getCurrentState, setCurrentState, getKey, setKey, getIsInitial, addOptionsGetter]
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
