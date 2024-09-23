import {
  CommonNavigationAction,
  ParamListBase,
  TabRouter as RNTabRouter,
  Router,
  TabActionType as RNTabActionType,
  TabNavigationState,
  TabRouterOptions as RNTabRouterOptions,
} from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { TriggerMap } from './common';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

export type ExpoTabsResetValue = 'always' | 'onFocus' | 'never';

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | {
      type: 'JUMP_TO';
      source?: string;
      target?: string;
      payload: {
        name: string;
        reset?: ExpoTabsResetValue;
        params?: object | undefined;
      };
    };

export function ExpoTabRouter({ triggerMap, ...options }: ExpoTabRouterOptions) {
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

      const name = action.payload.name;
      const trigger = triggerMap[name];

      if (!trigger) {
        // This is probably for a different navigator
        return null;
      } else if (trigger.type === 'external') {
        Linking.openURL(trigger.href);
        return state;
      }

      const route = state.routes.find((route) => route.name === trigger.routeNode.route);

      if (!route) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      // We should reset if this is the first time visiting the route
      let shouldReset = !state.history.some((item) => item.key === route?.key) && !route.state;

      if (!shouldReset && 'reset' in action.payload && action.payload.reset) {
        switch (action.payload.reset) {
          case 'never': {
            shouldReset = false;
            break;
          }
          case 'always': {
            shouldReset = true;
            break;
          }
          case 'onFocus': {
            shouldReset = state.routes[state.index].key === route.key;
            break;
          }
          default: {
            // TypeScript trick to ensure all use-cases are accounted for
            action.payload.reset satisfies never;
          }
        }
      }

      if (shouldReset) {
        options.routeParamList[route.name] = {
          ...options.routeParamList[route.name],
          ...trigger.action.payload.params,
        };
        return rnTabRouter.getStateForAction(state, trigger.action, options);
      } else {
        return rnTabRouter.getStateForRouteFocus(state, route.key);
      }
    },
  };

  return router;
}
