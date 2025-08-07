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

              const nestedParams =
                route.params &&
                'params' in route.params &&
                typeof route.params.params === 'object' &&
                route.params.params
                  ? route.params.params
                  : {};

              const isPreviewNavigation =
                action.payload.params &&
                '__internal__expoRouterIsPreviewNavigation' in action.payload.params
                  ? action.payload.params.__internal__expoRouterIsPreviewNavigation
                  : undefined;
              const previewKeyParams = isPreviewNavigation
                ? {
                    __internal__expoRouterIsPreviewNavigation: isPreviewNavigation,
                  }
                : {};

              const params = {
                ...(route.params || {}),
                ...previewKeyParams,
                // This is a workaround for the issue with the preview key not being passed to the params
                // https://github.com/Ubax/react-navigation/blob/main/packages/core/src/useNavigationBuilder.tsx#L573
                // Another solution would be to propagate the preview key in the useNavigationBuilder,
                // but that would require us to fork the @react-navigation/core package.
                params: {
                  ...nestedParams,
                  ...previewKeyParams,
                },
              };
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
