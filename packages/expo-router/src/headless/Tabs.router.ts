import {
  TabRouter as BaseTabRouter,
  TabRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabActionType,
  CommonNavigationAction,
  Router,
  PartialState,
} from '@react-navigation/native';

export type ExpoTabNavigationState = Omit<TabNavigationState<ParamListBase>, 'type'> & {
  type: 'expo-tab';
};
export type ExpoTabRouter = Router<ExpoTabNavigationState, TabActionType | CommonNavigationAction>;
export type ExpoTabRouterOptions = TabRouterOptions & {
  key: string;
};

export function TabRouter(routerOptions: ExpoTabRouterOptions): ExpoTabRouter {
  const router = BaseTabRouter(routerOptions);
  const type = 'expo-tab';
  const key = routerOptions.key;

  return {
    ...router,
    type: 'expo-tab',
    getInitialState(options) {
      const nextState = router.getInitialState(options);
      return {
        ...nextState,
        type,
        key,
        routes: nextState.routes.map((route) => {
          return {
            ...route,
          };
        }),
      };
    },
    getRehydratedState(state, options) {
      return {
        ...router.getRehydratedState(
          state as PartialState<TabNavigationState<ParamListBase>>,
          options
        ),
        type,
        key,
      };
    },
    getStateForRouteNamesChange(state, options) {
      return {
        ...router.getStateForRouteNamesChange(
          state as unknown as TabNavigationState<ParamListBase>,
          options
        ),
        type,
        key,
      };
    },
    getStateForRouteFocus(state, key) {
      return {
        ...router.getStateForRouteFocus(state as unknown as TabNavigationState<ParamListBase>, key),
        type,
        key,
      };
    },
    getStateForAction(state, action, options) {
      if ('payload' in action && action.payload) {
        const payload = action.payload;
        if ('name' in payload && payload.name) {
          const name = payload.name;

          if (!options.routeNames.includes(name)) {
            const nextName = options.routeNames.find((routeName) => {
              return routeName.startsWith(`${name}#`);
            });

            if (nextName) {
              payload.name = nextName;
            }
          }
        }
      }

      const nextState = router.getStateForAction(
        state as unknown as TabNavigationState<ParamListBase>,
        action,
        options
      );

      return nextState === null
        ? nextState
        : {
            ...nextState,
            type,
            key,
          };
    },
  };
}
