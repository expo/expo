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
  type InternalExpoRouterParams,
} from '../../navigationParams';

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
                expoParams['__internal_expo_router_no_animation'] = true;
              }

              const params = appendInternalExpoRouterParams(route.params, expoParams);
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
