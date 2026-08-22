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

export function NativeBottomTabsRouter(options: TabRouterOptions) {
  const tabRouter = TabRouter({ ...options });

  const nativeTabRouter: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...tabRouter,
    // @ts-expect-error TODO: For some reason this is not typed correctly
    getStateForAction: (state, action: TabActionType | CommonNavigationAction, options) => {
      switch (action.type) {
        case 'PUSH':
        case 'NAVIGATE': {
          const actionResult = tabRouter.getStateForAction(state, action, options);
          const newStateFromNavigation = actionResult?.state;

          if (!newStateFromNavigation) {
            return actionResult;
          }
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

              // TODO(@uabx): After __internal__routerActionState, change this to just state
              const isDeepDestination =
                action.payload.state?.__internal__routerActionState === true;
              if (isDeepDestination) {
                expoParams[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME] = true;
              }

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
              const state = route.state ? removeZoomParamsFromState(route.state) : undefined;
              return {
                ...route,
                state,
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
