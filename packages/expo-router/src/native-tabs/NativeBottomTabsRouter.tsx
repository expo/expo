import {
  CommonNavigationAction,
  ParamListBase,
  Router,
  TabActionType,
  TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from '@react-navigation/native';

import {
  appendInternalExpoRouterParams,
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  removeParams,
  type InternalExpoRouterParams,
} from '../navigationParams';

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
        case 'NAVIGATE': {
          const newStateFromNavigation = tabRouter.getStateForAction(state, action, options);
          const index = state.routes.findIndex((route) => route.name === action.payload.name);

          if (index === -1 || !newStateFromNavigation) {
            return newStateFromNavigation;
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

              if (route.params && 'screen' in route.params) {
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
                [
                  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
                  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
                ]
              );
              return {
                ...route,
                params,
              };
            }),
          };
          return newState;
        }
      }
      return tabRouter.getStateForAction(state, action, options);
    },
  };

  return nativeTabRouter;
}
