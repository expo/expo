import { nanoid } from 'nanoid/non-secure';

import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import {
  type CommonNavigationAction,
  type NavigationAction,
  type ParamListBase,
  type PartialRoute,
  type PartialState,
  type Route,
  type RouterConfigOptions,
  type StackActionType,
  type StackNavigationState,
  StackRouter as RNStackRouter,
} from '../react-navigation/native';
import type { NativeStackNavigatorProps } from '../react-navigation/native-stack';
import type { SingularOptions } from '../useScreens';
import { getSingularId } from '../useScreens';

type GetId = NonNullable<RouterConfigOptions['routeGetIdList'][string]>;

type RNNavigationAction = Extract<CommonNavigationAction, { type: 'NAVIGATE' }>;
type RNPreloadAction = Extract<CommonNavigationAction, { type: 'PRELOAD' }>;
type ExpoNavigationAction = Omit<RNNavigationAction, 'payload'> & {
  payload: Omit<RNNavigationAction['payload'], 'params'> & {
    params: RNNavigationAction['payload']['params'] & InternalExpoRouterParams;
  };
};

function isStackAction(
  action: NavigationAction
): action is StackActionType | RNPreloadAction | ExpoNavigationAction {
  return (
    action.type === 'PUSH' ||
    action.type === 'NAVIGATE' ||
    action.type === 'POP' ||
    action.type === 'POP_TO_TOP' ||
    action.type === 'REPLACE' ||
    action.type === 'PRELOAD'
  );
}

const isPreviewAction = (action: NavigationAction): action is ExpoNavigationAction =>
  !!action.payload &&
  'params' in action.payload &&
  typeof action.payload.params === 'object' &&
  !!getInternalExpoRouterParams(action.payload?.params ?? undefined)[
    INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME
  ];

const getZoomTransitionIdFromAction = (action: NavigationAction): string | undefined => {
  const allParams =
    !!action.payload && 'params' in action.payload && typeof action.payload.params === 'object'
      ? action.payload.params
      : undefined;
  const internalParams = getInternalExpoRouterParams(allParams ?? undefined);
  const val = internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
  if (val && typeof val === 'string') {
    return val;
  }
  return undefined;
};

/**
 * React Navigation matches a screen by its name or a 'getID' function that uniquely identifies a screen.
 * When a screen has been uniquely identified, the Stack can only have one instance of that screen.
 *
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a singular id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the singular screen logic.
 *
 */
export const stackRouterOverride: NonNullable<NativeStackNavigatorProps['UNSTABLE_router']> = (
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
          const activeRoutes = state.routes.slice(0, state.index + 1);
          const preloadedRoutes = state.routes.slice(state.index + 1);

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = activeRoutes.findLast(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          } else if (action.type === 'NAVIGATE') {
            const currentRoute = activeRoutes[state.index]!;

            // If the route matches the current one, then navigate to it
            if (action.payload.name === currentRoute.name && !isPreviewAction(action)) {
              route = currentRoute;
            } else if (action.payload.pop) {
              route = activeRoutes.findLast((route) => route.name === action.payload.name);
            }
          }

          // START FORK
          let isPreloadedRoute = false;
          if (isPreviewAction(action) && !route) {
            route = preloadedRoutes.find(
              (route) => route.name === action.payload.name && id === route.key
            );
            isPreloadedRoute = !!route;
          }
          // END FORK

          if (!route) {
            route = preloadedRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
            // START FORK
            isPreloadedRoute = !!route;
            // END FORK
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
              for (const r of activeRoutes) {
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

              // Promote the route when it is preloaded and therefore absent from the active routes.
              if (!routes.some((r) => r.key === route.key)) {
                routes.push({
                  ...route,
                  path: action.payload.path !== undefined ? action.payload.path : route.path,
                  params,
                });
              }
            } else {
              // START FORK
              // If there is an id, then filter out the existing route with the same id.
              // THIS ACTION IS DANGEROUS. This can cause React Native Screens to freeze
              if (id !== undefined) {
                routes = activeRoutes.filter((r) => r.key !== route.key);
              } else if (action.type === 'NAVIGATE' && activeRoutes.length > 0) {
                // The navigation action should only replace the last route if it has the same name and path params.
                const lastRoute = activeRoutes[activeRoutes.length - 1]!;
                if (
                  getSingularId(lastRoute.name, { params: lastRoute.params }) ===
                  getSingularId(route.name, { params })
                ) {
                  routes = activeRoutes.slice(0, -1);
                } else {
                  routes = [...activeRoutes];
                }
              } else {
                routes = [...activeRoutes];
              }

              // If the routes length is the same as the state routes length, then we are navigating to a new route.
              // Otherwise we are replacing an existing route.
              // For preloaded route, we want to use the same key, so that preloaded screen is used.
              const key =
                routes.length === activeRoutes.length && !isPreloadedRoute
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
              ...activeRoutes,
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
            routes: routes.concat(
              preloadedRoutes.filter((route) => routes[routes.length - 1]!.key !== route.key)
            ),
          };
          if (actionSingularOptions) {
            return filterSingular(result, getId);
          }

          const zoomTransitionId = getZoomTransitionIdFromAction(action);
          if (zoomTransitionId) {
            const lastRoute = result.routes[result.index]!;
            const key = lastRoute.key;
            const modifiedLastRoute: typeof lastRoute = {
              ...lastRoute,
              params: {
                ...lastRoute.params,
                [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: key,
              },
            };
            return {
              ...result,
              routes: result.routes.map((route, index) =>
                index === result.index ? modifiedLastRoute : route
              ),
            };
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
        case 'PRELOAD': {
          // START FORK
          // This will be the case for example for protected route
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }
          // END FORK
          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });
          const activeRoutes = state.routes.slice(0, state.index + 1);
          const preloadedRoutes = state.routes.slice(state.index + 1);

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = activeRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          }

          const preloadZoomTransitionId = getZoomTransitionIdFromAction(action);

          if (route) {
            return {
              ...state,
              routes: state.routes.map((r) => {
                if (r.key !== route?.key) {
                  return r;
                }
                const mergedParams =
                  routeParamList[action.payload.name] !== undefined
                    ? {
                        ...routeParamList[action.payload.name],
                        ...action.payload.params,
                      }
                    : action.payload.params;
                return {
                  ...r,
                  params: preloadZoomTransitionId
                    ? {
                        ...mergedParams,
                        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: r.key,
                      }
                    : mergedParams,
                };
              }),
            };
          } else {
            // START FORK
            const preloadedRouteKey = `${action.payload.name}-${nanoid()}`;
            const preloadedRouteParams =
              routeParamList[action.payload.name] !== undefined
                ? {
                    ...routeParamList[action.payload.name],
                    ...action.payload.params,
                  }
                : action.payload.params;
            const currentPreloadedRoute: (typeof state)['routes'][number] = {
              key: preloadedRouteKey,
              name: action.payload.name,
              params: preloadZoomTransitionId
                ? {
                    ...preloadedRouteParams,
                    [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: preloadedRouteKey,
                  }
                : preloadedRouteParams,
            };
            // END FORK
            return {
              ...state,
              // START FORK
              // Adding the current preloaded route to the beginning of the preloadedRoutes array
              // This ensures that the preloaded route will be the next one after the visible route
              // and when navigation will happen, there will be no reshuffling
              // This is a workaround for the link preview navigation issue, when screen would freeze after navigation from native side
              // and reshuffling from react-navigation
              routes: activeRoutes.concat(
                currentPreloadedRoute,
                preloadedRoutes.filter(
                  (r) => r.name !== action.payload.name || id !== getId?.({ params: r.params })
                )
              ),
              // preloadedRoutes: state.preloadedRoutes
              //   .filter(
              //     (r) =>
              //       r.name !== action.payload.name ||
              //       id !== getId?.({ params: r.params })
              //   )
              //   .concat({
              //     key: `${action.payload.name}-${nanoid()}`,
              //     name: action.payload.name,
              //     params:
              //       routeParamList[action.payload.name] !== undefined
              //         ? {
              //             ...routeParamList[action.payload.name],
              //             ...action.payload.params,
              //           }
              //         : action.payload.params,
              //   }),
              // END FORK
            };
          }
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

  // TODO(@kitten): This looks wrong as it's defaulting `index === 0`
  const currentIndex = state.index ?? state.routes.length - 1;
  const activeRoutes = state.routes.slice(0, currentIndex + 1);
  const preloadedRoutes = state.routes.slice(currentIndex + 1);
  const current = activeRoutes[currentIndex]!;
  const name = current.name;

  const id = getId?.({ params: current.params });

  if (!id) {
    return state;
  }

  // TypeScript needs a type assertion here for the filter to work.
  let routes = activeRoutes as PartialRoute<Route<string, object | undefined>>[];
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
    // Filtering preserves the input state's route type even though TypeScript widens it to partial routes.
    routes: [...routes, ...preloadedRoutes] as T extends null ? never : NonNullable<T>['routes'],
  };
}

export const StackRouter: typeof RNStackRouter = (options) => {
  const router = RNStackRouter(options);
  return {
    ...router,
    ...stackRouterOverride(router),
  };
};
