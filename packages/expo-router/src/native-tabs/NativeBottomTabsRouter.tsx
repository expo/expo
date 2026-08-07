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
  type KeyedPartialState,
  type NavigatorParamsPayload,
  type ParamListBase,
  type Router,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from '../react-navigation/native';

export function NativeBottomTabsRouter(options: TabRouterOptions) {
  const tabRouter = TabRouter({ ...options });

  const applyNativeTabParams = <
    State extends
      | TabNavigationState<ParamListBase>
      | KeyedPartialState<TabNavigationState<ParamListBase>>,
  >(
    state: State,
    name: string,
    params: object | undefined
  ): State => {
    const index = state.routes.findIndex((route) => route.name === name);
    if (index === -1) {
      return state;
    }

    // Mapping routes preserves every other field from fresh and keyed stale tab states.
    return {
      ...state,
      routes: state.routes.map((route) => {
        if (route.name !== name) {
          return route;
        }

        const expoParams: InternalExpoRouterParams = getInternalExpoRouterParams(params);

        if (route.params && 'screen' in route.params) {
          expoParams[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME] = true;
        }

        if (
          process.env.NODE_ENV !== 'production' &&
          expoParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]
        ) {
          console.warn(
            'Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.'
          );
        }

        const nextParams = removeParams(appendInternalExpoRouterParams(route.params, expoParams), [
          INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
          INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
        ]);
        return { ...route, params: nextParams };
      }),
    } as State;
  };

  const nativeTabRouter: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...tabRouter,
    getStateForAction: (state, action: TabActionType | CommonNavigationAction, options) => {
      switch (action.type) {
        case 'NAVIGATOR_PARAMS_CHANGED': {
          const result = nativeTabRouter.getStateForNavigatorParams!(
            state,
            action.payload.params,
            options
          );
          return result?.stale === false || result === null
            ? result
            : nativeTabRouter.getRehydratedState(result, options);
        }
        case 'NAVIGATE': {
          const newStateFromNavigation = tabRouter.getStateForAction(state, action, options);

          if (!newStateFromNavigation) {
            return newStateFromNavigation;
          }
          // Navigation from a fresh tab state always returns another fresh tab state.
          const freshState = newStateFromNavigation as TabNavigationState<ParamListBase>;
          return applyNativeTabParams(freshState, action.payload.name, action.payload.params);
        }
      }
      return tabRouter.getStateForAction(state, action, options);
    },
    getStateForNavigatorParams: (state, params: NavigatorParamsPayload, options) => {
      const result = tabRouter.getStateForNavigatorParams!(state, params, options);
      return result && params.screen
        ? applyNativeTabParams(result, params.screen, params.params)
        : result;
    },
  };

  return nativeTabRouter;
}
