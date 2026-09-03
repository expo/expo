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
import { attachRouteState } from '../react-navigation/routers/attachRouteState';
import { ensureStateType } from '../react-navigation/routers/ensureStateType';
import { createRouteKeyMinter } from '../react-navigation/routers/stateKeys';
import type { SingularOptions } from '../useScreens';
import { getSingularId } from '../utils/getSingularId';

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

const isPreviewAction = (action: NavigationAction): boolean =>
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
      state = ensureStateType(state, 'stack');

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

      switch (action.type) {
        case 'PUSH':
        case 'NAVIGATE': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const getId = getIdFunction();
          const id = getId?.({ params: action.payload.params });
          const activeRoutes = state.routes.slice(0, state.index + 1);
          const preloadedRoutes = state.routes.slice(state.index + 1);
          const isPreview = isPreviewAction(action);
          const activeMatch =
            id === undefined
              ? undefined
              : activeRoutes.findLast(
                  (route) =>
                    route.name === action.payload.name && id === getId?.({ params: route.params })
                );
          const previewRoute =
            isPreview && !activeMatch
              ? preloadedRoutes.find(
                  (route) => route.name === action.payload.name && id === route.key
                )
              : undefined;
          const currentRoute = activeRoutes[state.index]!;
          const shouldCreateSingularRoute =
            action.type === 'NAVIGATE' &&
            !isPreview &&
            id === undefined &&
            currentRoute.name === action.payload.name &&
            getSingularId(currentRoute.name, { params: currentRoute.params }) !==
              getSingularId(action.payload.name, { params: action.payload.params });
          const baseAction =
            isPreview && !activeMatch ? { ...action, type: 'PUSH' as const } : action;
          const routeGetIdList = { ...options.routeGetIdList };
          if (getId) {
            routeGetIdList[action.payload.name] = getId;
          }
          if (previewRoute) {
            const previewParams = previewRoute.params;
            const actionParams = action.payload.params;
            routeGetIdList[action.payload.name] = ({ params }) =>
              params === previewParams || params === actionParams ? id : getId?.({ params });
          }

          let actionResult: ReturnType<typeof original.getStateForAction>;
          if (shouldCreateSingularRoute) {
            const minter = createRouteKeyMinter(state);
            const params = action.payload.merge
              ? { ...currentRoute.params, ...action.payload.params }
              : action.payload.params;
            const route = attachRouteState(
              {
                key: minter.mint(action.payload.name),
                name: currentRoute.name,
                path: action.payload.path ?? currentRoute.path,
                params,
              },
              action
            );
            actionResult = {
              state: {
                ...state,
                routeKeySeq: minter.routeKeySeq,
                index: activeRoutes.length,
                routes: activeRoutes.concat(route, preloadedRoutes),
              },
              affectedRouteKey: route.key,
            };
          } else {
            actionResult = original.getStateForAction(state, baseAction, {
              ...options,
              routeGetIdList,
            });
          }
          if (!actionResult) {
            return actionResult;
          }

          const affectedRouteKey = actionResult.affectedRouteKey;
          const result = actionResult.state;
          if (actionSingularOptions) {
            const filteredState = filterSingular(result, getId);
            return { state: filteredState, affectedRouteKey };
          }

          const zoomTransitionId = getZoomTransitionIdFromAction(action);
          if (zoomTransitionId) {
            const lastRoute = result.routes[result.index]!;
            const modifiedLastRoute: typeof lastRoute = {
              ...lastRoute,
              params: {
                ...lastRoute.params,
                [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: affectedRouteKey,
              },
            };
            return {
              state: {
                ...result,
                routes: result.routes.map((route, index) =>
                  index === result.index ? modifiedLastRoute : route
                ),
              },
              affectedRouteKey,
            };
          }

          return { state: result, affectedRouteKey };
        }
        case 'PRELOAD': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }
          const actionResult = original.getStateForAction(state, action, options);
          if (!actionResult) {
            return actionResult;
          }
          const affectedRouteKey = actionResult.affectedRouteKey;
          const affectedIndex = actionResult.state.routes.findIndex(
            (route) => route.key === affectedRouteKey
          );
          const preloadZoomTransitionId = getZoomTransitionIdFromAction(action);
          let routes = actionResult.state.routes;

          if (affectedIndex > state.index + 1) {
            const affectedRoute = routes[affectedIndex]!;
            routes = routes
              .toSpliced(affectedIndex, 1)
              .toSpliced(state.index + 1, 0, affectedRoute);
          }
          if (preloadZoomTransitionId) {
            routes = routes.map((route) =>
              route.key === affectedRouteKey
                ? {
                    ...route,
                    params: {
                      ...route.params,
                      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: affectedRouteKey,
                    },
                  }
                : route
            );
          }

          return {
            state:
              routes === actionResult.state.routes
                ? actionResult.state
                : { ...actionResult.state, routes },
            affectedRouteKey,
          };
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
