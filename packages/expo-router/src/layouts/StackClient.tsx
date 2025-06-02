'use client';
import {
  CommonNavigationAction,
  NavigationAction,
  ParamListBase,
  PartialRoute,
  PartialState,
  Route,
  RouterConfigOptions,
  StackRouter as RNStackRouter,
  StackActionType,
  StackNavigationState,
} from '@react-navigation/native';
import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { nanoid } from 'nanoid/non-secure';
import { ComponentProps } from 'react';

import { withLayoutContext } from './withLayoutContext';
import { SingularOptions, getSingularId } from '../useScreens';
import { Protected } from '../views/Protected';

type GetId = NonNullable<RouterConfigOptions['routeGetIdList'][string]>;

const NativeStackNavigator = createNativeStackNavigator().Navigator;

const RNStack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof NativeStackNavigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(NativeStackNavigator);

function isStackAction(
  action: NavigationAction
): action is StackActionType | Extract<CommonNavigationAction, { type: 'NAVIGATE' }> {
  return (
    action.type === 'PUSH' ||
    action.type === 'NAVIGATE' ||
    action.type === 'POP' ||
    action.type === 'POP_TO_TOP' ||
    action.type === 'REPLACE'
  );
}

/**
 * React Navigation matches a screen by its name or a 'getID' function that uniquely identifies a screen.
 * When a screen has been uniquely identified, the Stack can only have one instance of that screen.
 *
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a singular id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the singular screen logic.
 *
 */
export const stackRouterOverride: NonNullable<ComponentProps<typeof RNStack>['UNSTABLE_router']> = (
  original
) => {
  return {
    getStateForAction: (state, action, options) => {
      if (action.target && action.target !== state.key) {
        return null;
      }

      if (!isStackAction(action)) {
        return original.getStateForAction(state, action, options);
      }

      // The dynamic getId added to an action, `router.push('screen', { singular: true })`
      const actionSingularOptions =
        action.payload && 'singular' in action.payload
          ? (action.payload.singular as SingularOptions)
          : undefined;

      // Handle if 'getID' or 'singular' is set.
      function getIdFunction(): GetId | undefined {
        // Actions can be fired by the user, so we do need to validate their structure.
        if (
          !('payload' in action) ||
          !action.payload ||
          !('name' in action.payload) ||
          typeof action.payload.name !== 'string'
        ) {
          return;
        }

        const actionName = action.payload.name;

        return (
          // The dynamic singular added to an action, `router.push('screen', { singular: () => 'id' })`
          getActionSingularIdFn(actionSingularOptions, actionName) ||
          // The static getId added as a prop to `<Screen singular />` or `<Screen getId={} />`
          options.routeGetIdList[actionName]
        );
      }

      const { routeParamList } = options;

      switch (action.type) {
        case 'PUSH':
        case 'NAVIGATE': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          // START FORK
          const getId = getIdFunction();
          // const getId = options.routeGetIdList[action.payload.name];
          // END FORK
          const id = getId?.({ params: action.payload.params });

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = state.routes.findLast(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          } else if (action.type === 'NAVIGATE') {
            const currentRoute = state.routes[state.index];

            // If the route matches the current one, then navigate to it
            if (action.payload.name === currentRoute.name) {
              route = currentRoute;
            } else if (action.payload.pop) {
              route = state.routes.findLast((route) => route.name === action.payload.name);
            }
          }

          if (!route) {
            route = state.preloadedRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          }

          let params;

          if (action.type === 'NAVIGATE' && action.payload.merge && route) {
            params =
              action.payload.params !== undefined ||
              routeParamList[action.payload.name] !== undefined
                ? {
                    ...routeParamList[action.payload.name],
                    ...route.params,
                    ...action.payload.params,
                  }
                : route.params;
          } else {
            params =
              routeParamList[action.payload.name] !== undefined
                ? {
                    ...routeParamList[action.payload.name],
                    ...action.payload.params,
                  }
                : action.payload.params;
          }

          let routes: Route<string>[];

          if (route) {
            if (action.type === 'NAVIGATE' && action.payload.pop) {
              routes = [];

              // Get all routes until the matching one
              for (const r of state.routes) {
                if (r.key === route.key) {
                  routes.push({
                    ...route,
                    path: action.payload.path !== undefined ? action.payload.path : route.path,
                    params,
                  });
                  break;
                }

                routes.push(r);
              }
            } else {
              // START FORK
              // If there is an id, then filter out the existing route with the same id.
              // THIS ACTION IS DANGEROUS. This can cause React Native Screens to freeze
              if (id !== undefined) {
                routes = state.routes.filter((r) => r.key !== route.key);
              } else if (action.type === 'NAVIGATE' && state.routes.length > 0) {
                // The navigation action should only replace the last route if it has the same name and path params.
                const lastRoute = state.routes[state.routes.length - 1];
                if (
                  getSingularId(lastRoute.name, { params: lastRoute.params }) ===
                  getSingularId(route.name, { params })
                ) {
                  routes = state.routes.slice(0, -1);
                } else {
                  routes = [...state.routes];
                }
              } else {
                routes = [...state.routes];
              }

              // If the routes length is the same as the state routes length, then we are navigating to a new route.
              // Otherwise we are replacing an existing route.
              const key =
                routes.length === state.routes.length
                  ? `${action.payload.name}-${nanoid()}`
                  : route.key;

              routes.push({
                ...route,
                key,
                path:
                  action.type === 'NAVIGATE' && action.payload.path !== undefined
                    ? action.payload.path
                    : route.path,
                params,
              });

              // routes = state.routes.filter((r) => r.key !== route.key);
              // routes.push({
              //   ...route,
              //   path:
              //     action.type === 'NAVIGATE' && action.payload.path !== undefined
              //       ? action.payload.path
              //       : route.path,
              //   params,
              // });
              // END FORK
            }
          } else {
            routes = [
              ...state.routes,
              {
                key: `${action.payload.name}-${nanoid()}`,
                name: action.payload.name,
                path: action.type === 'NAVIGATE' ? action.payload.path : undefined,
                params,
              },
            ];
          }

          // START FORK
          // return filterSingular(
          const result = {
            ...state,
            index: routes.length - 1,
            preloadedRoutes: state.preloadedRoutes.filter(
              (route) => routes[routes.length - 1].key !== route.key
            ),
            routes,
          };

          if (actionSingularOptions) {
            return filterSingular(result, getId);
          }

          return result;
          // return {
          //   ...state,
          //   index: routes.length - 1,
          //   preloadedRoutes: state.preloadedRoutes.filter(
          //     (route) => routes[routes.length - 1].key !== route.key
          //   ),
          //   routes,
          // };
          // END FORK
        }
        default: {
          return original.getStateForAction(state, action, options);
        }
      }
    },
  };
};

function getActionSingularIdFn(
  actionGetId: SingularOptions | undefined,
  name: string
): GetId | undefined {
  if (typeof actionGetId === 'function') {
    return (options) => actionGetId(name, options.params ?? {});
  } else if (actionGetId === true) {
    return (options) => getSingularId(name, options);
  }

  return undefined;
}

/**
 * If there is a dynamic singular on an action, then we need to filter the state to only have singular screens.
 * As multiples may have been added before we did the singular navigation.
 */
function filterSingular<
  T extends
    | StackNavigationState<ParamListBase>
    | PartialState<StackNavigationState<ParamListBase>>
    | null,
>(state: T, getId?: GetId): T {
  if (!state) {
    return state;
  }

  if (!state.routes) {
    return state;
  }

  const currentIndex = state.index || state.routes.length - 1;
  const current = state.routes[currentIndex];
  const name = current.name;

  const id = getId?.({ params: current.params });

  if (!id) {
    return state;
  }

  // TypeScript needs a type assertion here for the filter to work.
  let routes = state.routes as PartialRoute<Route<string, object | undefined>>[];
  routes = routes.filter((route, index) => {
    // If the route is the current route, keep it.
    if (index === currentIndex) {
      return true;
    }

    // Remove all other routes with the same name and id.
    return name !== route.name || id !== getId?.({ params: route.params });
  });

  return {
    ...state,
    index: routes.length - 1,
    routes,
  };
}

const Stack = Object.assign(
  (props: ComponentProps<typeof RNStack>) => {
    return <RNStack {...props} UNSTABLE_router={stackRouterOverride} />;
  },
  {
    Screen: RNStack.Screen as (
      props: ComponentProps<typeof RNStack.Screen> & { singular?: boolean }
    ) => null,
    Protected,
  }
);

export default Stack;

export const StackRouter: typeof RNStackRouter = (options) => {
  const router = RNStackRouter(options);
  return {
    ...router,
    ...stackRouterOverride(router),
  };
};
