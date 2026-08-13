import {
  type CommonNavigationAction,
  type ParamListBase,
  type Router,
  type TabActionType as RNTabActionType,
  type TabNavigationState,
  type TabRouterOptions as RNTabRouterOptions,
  TabRouter as RNTabRouter,
} from '../react-navigation/native';
import { attachRouteState, type RouteState } from '../react-navigation/routers/attachRouteState';
import type { TriggerMap } from './common';

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

      const route = state.routes.find((route) => route.name === action.payload.name);

      if (!route) {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }

      // We should reset if this is the first time visiting the route.
      let shouldReset =
        !(state.history == null ? state.routes : state.history).some(
          (item) => item.key === route.key
        ) && !route.state;

      if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
        shouldReset = state.routes[state.index ?? 0]!.key !== route.key;
      }

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
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      } else if (route.state !== undefined) {
        // TODO(@ubax): Remove this branch together with nested trigger href support. Refocusing
        // a tab that hosts a navigator must not re-apply the trigger's nested payload
        // (`params.screen`), which would reset the preserved child state.
        const selectedRoute = attachRouteState(route, action);
        const nextState =
          selectedRoute === route
            ? state
            : {
                ...state,
                routes: state.routes.map((r) => (r.key === route.key ? selectedRoute : r)),
              };
        return {
          state: rnTabRouter.getStateForRouteFocus(nextState, route.key),
          affectedRouteKey: route.key,
        };
      } else {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }
    },
  };

  return router;
}
