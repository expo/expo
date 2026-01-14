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
  type RouteProp,
} from '@react-navigation/native';
import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { nanoid } from 'nanoid/non-secure';
import React, { Children, ComponentProps, useMemo } from 'react';

import { withLayoutContext } from './withLayoutContext';
import { createNativeStackNavigator } from '../fork/native-stack/createNativeStackNavigator';
import { useLinkPreviewContext } from '../link/preview/LinkPreviewContext';
import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import { SingularOptions, getSingularId } from '../useScreens';
import {
  type StackScreenProps,
  StackHeader,
  StackScreen,
  StackSearchBar,
  appendScreenStackPropsToOptions,
} from './stack-utils';
import { isChildOfType } from '../utils/children';
import { Protected, type ProtectedProps } from '../views/Protected';
import { Screen } from '../views/Screen';

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
    /**
     * Override the modal shadow filter (any valid CSS filter value, e.g. 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' or 'none').
     * @platform web
     */
    shadow?: string;
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
            if (action.payload.name === currentRoute.name && !isPreviewAction(action)) {
              route = currentRoute;
            } else if (action.payload.pop) {
              route = state.routes.findLast((route) => route.name === action.payload.name);
            }
          }

          // START FORK
          let isPreloadedRoute = false;
          if (isPreviewAction(action) && !route) {
            route = state.preloadedRoutes.find(
              (route) => route.name === action.payload.name && id === route.key
            );
            isPreloadedRoute = !!route;
          }
          // END FORK

          if (!route) {
            route = state.preloadedRoutes.find(
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
              // For preloaded route, we want to use the same key, so that preloaded screen is used.
              const key =
                routes.length === state.routes.length && !isPreloadedRoute
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

          const zoomTransitionId = getZoomTransitionIdFromAction(action);
          if (zoomTransitionId) {
            const lastRoute = result.routes[result.routes.length - 1];
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
              routes: [...result.routes.slice(0, -1), modifiedLastRoute],
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

function mapProtectedScreen(props: ProtectedProps): ProtectedProps {
  return {
    ...props,
    children: Children.toArray(props.children)
      .map((child, index) => {
        if (isChildOfType(child, StackScreen)) {
          const options = appendScreenStackPropsToOptions({}, child.props);
          const { children, ...rest } = child.props;
          return <Screen key={child.props.name} {...rest} options={options} />;
        } else if (isChildOfType(child, Protected)) {
          return <Protected key={`${index}-${props.guard}`} {...mapProtectedScreen(child.props)} />;
        } else if (isChildOfType(child, StackHeader)) {
          // Ignore Stack.Header, because it can be used to set header options for Stack
          // and we use this function to process children of Stack, as well.
          return null;
        } else {
          if (React.isValidElement(child)) {
            console.warn(`Warning: Unknown child element passed to Stack: ${child.type}`);
          } else {
            console.warn(`Warning: Unknown child element passed to Stack: ${child}`);
          }
        }
        return null;
      })
      .filter(Boolean),
  };
}

const Stack = Object.assign(
  (props: ComponentProps<typeof RNStack>) => {
    const { isStackAnimationDisabled } = useLinkPreviewContext();

    const screenOptionsWithCompositionAPIOptions = useMemo<NativeStackScreenOptions>(() => {
      const stackHeader = Children.toArray(props.children).find((child) =>
        isChildOfType(child, StackHeader)
      );
      if (stackHeader) {
        const screenStackProps: StackScreenProps = { children: stackHeader };
        const currentOptions = props.screenOptions;
        if (currentOptions) {
          if (typeof currentOptions === 'function') {
            return (...args) => {
              const options = currentOptions(...args);
              return appendScreenStackPropsToOptions(options, screenStackProps);
            };
          }
          return appendScreenStackPropsToOptions(currentOptions, screenStackProps);
        } else {
          return appendScreenStackPropsToOptions({}, screenStackProps);
        }
      } else {
        return props.screenOptions;
      }
    }, [props.screenOptions, props.children]);

    const screenOptions = useMemo(() => {
      const condition = isStackAnimationDisabled ? () => true : shouldDisableAnimationBasedOnParams;

      return disableAnimationInScreenOptions(screenOptionsWithCompositionAPIOptions, condition);
    }, [screenOptionsWithCompositionAPIOptions, isStackAnimationDisabled]);

    const rnChildren = useMemo(
      () => mapProtectedScreen({ guard: true, children: props.children }).children,
      [props.children]
    );

    return (
      <RNStack
        {...props}
        children={rnChildren}
        screenOptions={screenOptions}
        UNSTABLE_router={stackRouterOverride}
      />
    );
  },
  {
    Screen: StackScreen,
    Protected,
    Header: StackHeader,
    SearchBar: StackSearchBar,
  }
);

type NativeStackScreenOptions = ComponentProps<typeof RNStack>['screenOptions'];

function disableAnimationInScreenOptions(
  options: NativeStackScreenOptions | undefined,
  condition: (route: RouteProp<ParamListBase, string>) => boolean
): NativeStackScreenOptions {
  if (options && typeof options === 'function') {
    return (props) => {
      const oldOptions = options(props);
      if (condition(props.route)) {
        return {
          ...oldOptions,
          animation: 'none',
        };
      }
      return oldOptions ?? {};
    };
  }
  return (props) => {
    if (condition(props.route)) {
      return {
        ...(options ?? {}),
        animation: 'none',
      };
    }
    return options ?? {};
  };
}

function shouldDisableAnimationBasedOnParams(route: RouteProp<ParamListBase, string>): boolean {
  const expoParams = getInternalExpoRouterParams(route.params);
  return !!expoParams[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME];
}

export default Stack;

export const StackRouter: typeof RNStackRouter = (options) => {
  const router = RNStackRouter(options);
  return {
    ...router,
    ...stackRouterOverride(router),
  };
};
