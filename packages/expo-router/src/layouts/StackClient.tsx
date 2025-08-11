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
} from '@react-navigation/native-stack';
import { nanoid } from 'nanoid/non-secure';
import { ComponentProps, useMemo } from 'react';
import { StackAnimationTypes } from 'react-native-screens';

import { withLayoutContext } from './withLayoutContext';
import { createNativeStackNavigator } from '../fork/native-stack/createNativeStackNavigator';
import { useLinkPreviewContext } from '../link/preview/LinkPreviewContext';
import { SingularOptions, getSingularId } from '../useScreens';
import { Protected } from '../views/Protected';

type GetId = NonNullable<RouterConfigOptions['routeGetIdList'][string]>;

const NativeStackNavigator = createNativeStackNavigator().Navigator;

/**
 * We extend NativeStackNavigationOptions with our custom props
 * to allow for several extra props to be used on web, like modalWidth
 */
export type ExtendedStackNavigationOptions = NativeStackNavigationOptions & {
  webModalStyle?: {
    /**
     * Override the width of the modal (px or percentage). Only applies on web platform.
     * @platform web
     */
    width?: number | string;
    /**
     * Override the height of the modal (px or percentage). Applies on web desktop.
     * @platform web
     */
    height?: number | string;
    /**
     * Minimum height of the desktop modal (px or percentage). Overrides the default 640px clamp.
     * @platform web
     */
    minHeight?: number | string;
    /**
     * Minimum width of the desktop modal (px or percentage). Overrides the default 580px.
     * @platform web
     */
    minWidth?: number | string;
    /**
     * Override the border of the desktop modal (any valid CSS border value, e.g. '1px solid #ccc' or 'none').
     * @platform web
     */
    border?: string;
    /**
     * Override the overlay background color (any valid CSS color or rgba/hsla value).
     * @platform web
     */
    overlayBackground?: string;
  };
};

const RNStack = withLayoutContext<
  ExtendedStackNavigationOptions,
  typeof NativeStackNavigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(NativeStackNavigator);

type RNNavigationAction = Extract<CommonNavigationAction, { type: 'NAVIGATE' }>;
type RNPreloadAction = Extract<CommonNavigationAction, { type: 'PRELOAD' }>;
type ExpoNavigationAction = Omit<RNNavigationAction, 'payload'> & {
  payload: Omit<RNNavigationAction['payload'], 'params'> & {
    params: {
      __internal__expoRouterIsPreviewNavigation?: boolean;
      params?: Record<string, unknown>;
    };
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
  !!action.payload.params &&
  typeof action.payload === 'object' &&
  '__internal__expoRouterIsPreviewNavigation' in (action.payload.params as any) &&
  !!(action.payload.params as any).__internal__expoRouterIsPreviewNavigation;

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

          // START FORK
          if (isPreviewAction(action)) {
            route = state.preloadedRoutes.find(
              (route) => route.name === action.payload.name && id === route.key
            );
          }
          // END FORK

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
                routes.length === state.routes.length && !isPreviewAction(action)
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
        case 'PRELOAD': {
          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = state.routes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          }

          if (route) {
            return {
              ...state,
              routes: state.routes.map((r) => {
                if (r.key !== route?.key) {
                  return r;
                }
                return {
                  ...r,
                  params:
                    routeParamList[action.payload.name] !== undefined
                      ? {
                          ...routeParamList[action.payload.name],
                          ...action.payload.params,
                        }
                      : action.payload.params,
                };
              }),
            };
          } else {
            // START FORK
            const currentPreloadedRoute: (typeof state)['preloadedRoutes'][number] = {
              key: `${action.payload.name}-${nanoid()}`,
              name: action.payload.name,
              params:
                routeParamList[action.payload.name] !== undefined
                  ? {
                      ...routeParamList[action.payload.name],
                      ...action.payload.params,
                    }
                  : action.payload.params,
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
              preloadedRoutes: [currentPreloadedRoute].concat(
                state.preloadedRoutes.filter(
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
    const { isStackAnimationDisabled } = useLinkPreviewContext();
    const screenOptions = useMemo(() => {
      if (isStackAnimationDisabled) {
        return disableAnimationInScreenOptions(props.screenOptions);
      }
      return props.screenOptions;
    }, [props.screenOptions, isStackAnimationDisabled]);

    return (
      <RNStack {...props} screenOptions={screenOptions} UNSTABLE_router={stackRouterOverride} />
    );
  },
  {
    Screen: RNStack.Screen as (
      props: ComponentProps<typeof RNStack.Screen> & { singular?: boolean }
    ) => null,
    Protected,
  }
);

type NativeStackScreenOptions = ComponentProps<typeof RNStack>['screenOptions'];

function disableAnimationInScreenOptions(
  options: NativeStackScreenOptions | undefined
): NativeStackScreenOptions {
  const animationNone: StackAnimationTypes = 'none';
  if (options) {
    if (typeof options === 'function') {
      const newOptions: typeof options = (...args) => {
        const oldResult = options(...args);
        return {
          ...oldResult,
          animation: animationNone,
        };
      };
      return newOptions;
    }
    return {
      ...options,
      animation: animationNone,
    };
  }
  return {
    animation: animationNone,
  };
}

export default Stack;

export const StackRouter: typeof RNStackRouter = (options) => {
  const router = RNStackRouter(options);
  return {
    ...router,
    ...stackRouterOverride(router),
  };
};
