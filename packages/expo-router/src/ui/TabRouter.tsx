import {
  CommonNavigationAction,
  ParamListBase,
  TabRouter as RNTabRouter,
  Router,
  TabActionType as RNTabActionType,
  TabNavigationState,
  TabRouterOptions as RNTabRouterOptions,
} from '@react-navigation/native';

import { TriggerMap } from './common';

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
      };
    };

export function ExpoTabRouter(options: ExpoTabRouterOptions) {
  const rnTabRouter = RNTabRouter(options);

  const router: Router<
    TabNavigationState<ParamListBase>,
    ExpoTabActionType | CommonNavigationAction
  > = {
    ...rnTabRouter,
    getStateForAction(state, action, options) {
      if (action.type !== 'JUMP_TO') {
        return rnTabRouter.getStateForAction(state, action, options);
      }

      const route = state.routes.find((route) => route.name === action.payload.name);

      if (!route) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      // We should reset if this is the first time visiting the route
      let shouldReset = !state.history.some((item) => item.key === route?.key) && !route.state;

      if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
        shouldReset = state.routes[state.index].key !== route.key;
      }

      if (shouldReset) {
        options.routeParamList[route.name] = {
          ...options.routeParamList[route.name],
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
        return rnTabRouter.getStateForAction(state, action, options);
      } else {
        return rnTabRouter.getStateForRouteFocus(state, route.key);
      }
    },
  };

  return router;
}
