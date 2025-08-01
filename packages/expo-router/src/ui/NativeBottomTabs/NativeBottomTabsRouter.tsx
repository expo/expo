import {
  CommonNavigationAction,
  ParamListBase,
  Router,
  TabActionType,
  TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from '@react-navigation/native';

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
              const payload = action.payload as typeof action.payload & {
                previewKey?: string;
              };
              return {
                ...route,
                params: route.params
                  ? {
                      ...route.params,
                      __internal__expoRouterPreviewKey: payload.previewKey,
                    }
                  : {
                      __internal__expoRouterPreviewKey: payload.previewKey,
                    },
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
