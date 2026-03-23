import type {
  NavigationState,
  ParamListBase,
  PartialState,
  Route,
} from '@react-navigation/routers';
import * as React from 'react';

import { EnsureSingleNavigator } from './EnsureSingleNavigator';
import { isArrayEqual } from './isArrayEqual';
import {
  type FocusedRouteState,
  NavigationFocusedRouteStateContext,
} from './NavigationFocusedRouteStateContext';
import { NavigationStateContext } from './NavigationStateContext';
import { StaticContainer } from './StaticContainer';
import type { NavigationProp, RouteConfigComponent } from './types';
import { useOptionsGetters } from './useOptionsGetters';

type Props<State extends NavigationState, ScreenOptions extends {}> = {
  screen: RouteConfigComponent<ParamListBase, string> & { name: string };
  navigation: NavigationProp<
    ParamListBase,
    string,
    string | undefined,
    State,
    ScreenOptions
  >;
  route: Route<string>;
  routeState: NavigationState | PartialState<NavigationState> | undefined;
  getState: () => State;
  setState: (state: State) => void;
  options: object;
  clearOptions: () => void;
};

/**
 * Component which takes care of rendering the screen for a route.
 * It provides all required contexts and applies optimizations when applicable.
 */
export function SceneView<
  State extends NavigationState,
  ScreenOptions extends {},
>({
  screen,
  route,
  navigation,
  routeState,
  getState,
  setState,
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

  const setCurrentState = React.useCallback(
    (child: NavigationState | PartialState<NavigationState> | undefined) => {
      const state = getState();

      const routes = state.routes.map((r) => {
        if (r.key === route.key && r.state !== child) {
          return {
            ...r,
            state: child,
          };
        }

        return r;
      });

      if (!isArrayEqual(state.routes, routes)) {
        setState({
          ...state,
          routes,
        });
      }
    },
    [getState, route.key, setState]
  );

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

  const parentFocusedRouteState = React.useContext(
    NavigationFocusedRouteStateContext
  );

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
    const addState = (
      parent: FocusedRouteState | undefined
    ): FocusedRouteState => {
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
  }, [
    parentFocusedRouteState,
    route.key,
    route.name,
    route.params,
    route.path,
  ]);

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
    [
      routeState,
      getCurrentState,
      setCurrentState,
      getKey,
      setKey,
      getIsInitial,
      addOptionsGetter,
    ]
  );

  const ScreenComponent = screen.getComponent
    ? screen.getComponent()
    : screen.component;

  return (
    <NavigationStateContext.Provider value={context}>
      <NavigationFocusedRouteStateContext.Provider value={focusedRouteState}>
        <EnsureSingleNavigator>
          <StaticContainer
            name={screen.name}
            render={ScreenComponent || screen.children}
            navigation={navigation}
            route={route}
          >
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
