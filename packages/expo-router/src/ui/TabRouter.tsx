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
import { store } from '../global-state/router-store';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | {
      type: 'SWITCH_TABS';
      payload: { name: string; reset?: boolean };
      source?: string;
      target?: string;
    };

export function ExpoTabRouter({ triggerMap, ...options }: ExpoTabRouterOptions) {
  const rnTabRouter = RNTabRouter(options);

  const router: Router<
    TabNavigationState<ParamListBase>,
    ExpoTabActionType | CommonNavigationAction
  > = {
    ...rnTabRouter,
    getStateForAction(state, action, options) {
      if (action.type === 'SWITCH_TABS') {
        const name = action.payload.name;
        const trigger = triggerMap[name];

        if (!trigger) {
          // Maybe this trigger is handled by a parent Tabs?
          return null;
        } else if (trigger.type === 'external') {
          store.navigate(trigger.href);
          return state;
        }

        const route = state.routes.find((route) => route.name === trigger.routeNode.route);

        if (!route) {
          // Maybe we have two <Tabs /> with triggers with the same name, but different routes
          return null;
        }

        const shouldReset = action.payload.reset === true;
        const historyState = state.history.find((item) => item.key === route?.key);

        if (shouldReset || !historyState) {
          return rnTabRouter.getStateForAction(state, trigger.action, options);
        } else {
          state = rnTabRouter.getStateForRouteFocus(state, route.key);
          return state;
        }
      } else {
        return rnTabRouter.getStateForAction(state, action, options);
      }
    },
  };

  return router;
}
