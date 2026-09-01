import {
  type CommonNavigationAction,
  type ParamListBase,
  type Router,
  type TabActionType as RNTabActionType,
  type TabNavigationState,
  type TabRouterOptions as RNTabRouterOptions,
  TabRouter as RNTabRouter,
} from '../react-navigation/native';
import { ensureStateHistory } from '../react-navigation/routers/TabRouter';
import { attachRouteState, type RouteState } from '../react-navigation/routers/attachRouteState';
import { ensureStateType } from '../react-navigation/routers/ensureStateType';
import { getTabRoute, type TriggerMap } from './common';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | {
      type: 'JUMP_TO';
      source?: string;
      target?: string;
      payload: {
        name: string;
        resetOnFocus?: boolean;
        params?: object;
        state?: RouteState;
      };
    };

export function ExpoTabRouter(options: ExpoTabRouterOptions) {
  const rnTabRouter = RNTabRouter(options);

  const router: Router<
    TabNavigationState<ParamListBase>,
    ExpoTabActionType | CommonNavigationAction
  > = {
    ...rnTabRouter,
    getStateForAction(state, action, routerConfigOptions) {
      if (action.type !== 'JUMP_TO') {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }

      const { route, isSwitching } = getTabRoute(state, action.payload.name);

      if (!route) {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }

      const shouldReset =
        'resetOnFocus' in action.payload && Boolean(action.payload.resetOnFocus && isSwitching);

      if (shouldReset) {
        state = {
          ...state,
          routes: state.routes.map((r) => {
            if (r.key !== route.key) {
              return r;
            }
            return { ...r, state: undefined };
          }),
        };
      }

      if (!isSwitching && route.state !== undefined) {
        const selectedRoute = attachRouteState(route, action);
        if (selectedRoute === route) {
          state = ensureStateType(
            ensureStateHistory(
              state,
              options.backBehavior ?? 'firstRoute',
              options.initialRouteName
            ),
            'tab'
          );
          return { state, affectedRouteKey: route.key };
        }
      }

      return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
    },
  };

  return router;
}
