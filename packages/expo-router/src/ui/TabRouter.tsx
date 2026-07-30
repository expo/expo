import {
  type CommonNavigationAction,
  type ParamListBase,
  type Router,
  type TabActionType as RNTabActionType,
  type TabNavigationState,
  type TabRouterOptions as RNTabRouterOptions,
  TabRouter as RNTabRouter,
} from '../react-navigation/native';
import { getRouteHistory } from '../react-navigation/routers/TabRouter';
import type { TriggerMap } from './common';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | {
      type: 'EXPO_ROUTER_TAB_ORDER_CHANGED';
      source?: string;
      target?: string;
      payload: { routeNames: string[] };
    }
  | {
      type: 'JUMP_TO';
      source?: string;
      target?: string;
      payload: {
        name: string;
        resetOnFocus?: boolean;
        params?: object;
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
      if (action.type === 'EXPO_ROUTER_TAB_ORDER_CHANGED') {
        // Reorder `state.routes` to the new trigger order, reusing the existing route
        // objects by name so keys and screen state survive.
        const { routeNames } = action.payload;
        const routes = routeNames.map((name) => state.routes.find((r) => r.name === name));

        if (routes.length !== state.routes.length || routes.some((route) => route == null)) {
          // The set of routes changed, not just the order. That is reconciled separately by
          // the `ROUTE_NAMES_CHANGED` action (dispatched from `useStateForRouteNamesChange`).
          return state;
        }

        const focusedKey = state.routes[state.index]!.key;
        const index = routes.findIndex((route) => route!.key === focusedKey);

        const backBehavior = options.backBehavior ?? 'firstRoute';
        let history = state.history;
        if (
          backBehavior === 'firstRoute' ||
          backBehavior === 'initialRoute' ||
          backBehavior === 'order'
        ) {
          // These behaviors derive history from route order, so recompute it.
          // `history` back behavior keeps its visit history untouched.
          history = getRouteHistory(
            routes as typeof state.routes,
            index,
            backBehavior,
            options.initialRouteName
          );
        }

        return {
          ...state,
          routeNames,
          routes: routes as typeof state.routes,
          index,
          history,
        };
      } else if (action.type !== 'JUMP_TO') {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }

      const route = state.routes.find((route) => route.name === action.payload.name);

      if (!route || !state) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      // We should reset if this is the first time visiting the route
      let shouldReset = !state.history?.some((item) => item.key === route?.key) && !route.state;

      if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
        shouldReset = state.routes[state.index ?? 0]!.key !== route.key;
      }

      if (shouldReset) {
        routerConfigOptions.routeParamList[route.name] = {
          ...routerConfigOptions.routeParamList[route.name],
        };
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
        return rnTabRouter.getStateForRouteFocus(state, route.key);
      } else {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }
    },
  };

  return router;
}
