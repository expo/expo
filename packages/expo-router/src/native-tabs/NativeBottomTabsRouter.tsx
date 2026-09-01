import {
  appendInternalExpoRouterParams,
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  removeParams,
  type InternalExpoRouterParams,
} from '../navigationParams';
import {
  type CommonNavigationAction,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type Router,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from '../react-navigation/native';

const zoomParamNames = [
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
] as const;

// TODO(@ubax): Simplify this logic, so it is clearer and easier to understand
// At the moment this is needed to remove zoom params from current level and all nested levels
// so that there is no zoom transition in tabs. Check if there are any better ways to address this
// problem
function removeZoomParamsFromState<T extends NavigationState | PartialState<NavigationState>>(
  state: T
): T {
  let changed = false;
  const routes = state.routes.map((route) => {
    const hasZoomParams =
      route.params &&
      zoomParamNames.some((paramName) => paramName in (route.params as Record<string, unknown>));
    const params = hasZoomParams ? removeParams(route.params, zoomParamNames) : route.params;
    const childState = route.state ? removeZoomParamsFromState(route.state) : undefined;
    if (!hasZoomParams && childState === route.state) {
      return route;
    }
    changed = true;
    return {
      ...route,
      ...(hasZoomParams ? { params } : undefined),
      ...(childState ? { state: childState } : undefined),
    };
  });

  // The mapped routes preserve the input state's full or partial route shape.
  return changed ? ({ ...state, routes } as T) : state;
}

function appendNoAnimationParamToFocusedRoutes<
  T extends NavigationState | PartialState<NavigationState>,
>(state: T): T {
  const focusedIndex = state.index ?? state.routes.length - 1;
  const focusedRoute = state.routes[focusedIndex];
  if (!focusedRoute) {
    return state;
  }

  const childState = focusedRoute.state
    ? appendNoAnimationParamToFocusedRoutes(focusedRoute.state)
    : undefined;
  const routes = state.routes.map((route, index) =>
    index === focusedIndex
      ? {
          ...route,
          params: appendInternalExpoRouterParams(route.params, {
            [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
          }),
          ...(childState ? { state: childState } : undefined),
        }
      : route
  );

  // The mapped routes preserve the input state's full or partial route shape.
  return { ...state, routes } as T;
}

export function NativeBottomTabsRouter(options: TabRouterOptions) {
  const tabRouter = TabRouter({ ...options });

  const nativeTabRouter: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...tabRouter,
    getStateForAction: (state, action: TabActionType | CommonNavigationAction, options) => {
      switch (action.type) {
        case 'PUSH':
        case 'NAVIGATE': {
          const actionResult = tabRouter.getStateForAction(state, action, options);
          const newStateFromNavigation = actionResult?.state;

          if (!newStateFromNavigation) {
            return actionResult;
          }
          const focusedRouteKey = state.routes[state.index]?.key;
          const nextFocusedRouteKey =
            newStateFromNavigation.routes[newStateFromNavigation.index]?.key;
          const didTabChange =
            focusedRouteKey !== undefined &&
            nextFocusedRouteKey !== undefined &&
            focusedRouteKey !== nextFocusedRouteKey;
          const index = newStateFromNavigation.routes.findIndex(
            (route) => route.name === action.payload.name
          );
          if (index === -1) {
            return actionResult;
          }

          const newState = {
            ...newStateFromNavigation,
            routes: newStateFromNavigation.routes.map((route) => {
              if (route.name !== action.payload.name) {
                return route;
              }

              const expoParams: InternalExpoRouterParams = getInternalExpoRouterParams(
                action.payload.params
              );

              if (process.env.NODE_ENV !== 'production') {
                if (expoParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]) {
                  console.warn(
                    'Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.'
                  );
                }
              }

              // Zoom transition needs to be disabled for navigation inside tabs
              // Otherwise user can end up in a situation where a view is missing on one tab
              // because it was used to perform zoom transition on another tab
              const params = removeParams(
                appendInternalExpoRouterParams(route.params, expoParams),
                zoomParamNames
              );
              let childState = route.state ? removeZoomParamsFromState(route.state) : undefined;
              if (
                childState &&
                didTabChange &&
                action.payload.state?.__internal__routerActionState === true
              ) {
                childState = appendNoAnimationParamToFocusedRoutes(childState);
              }
              return {
                ...route,
                ...(childState ? { state: childState } : undefined),
                params,
              };
            }),
          };
          return { ...actionResult, state: newState };
        }
      }
      return tabRouter.getStateForAction(state, action, options);
    },
  };

  return nativeTabRouter;
}
