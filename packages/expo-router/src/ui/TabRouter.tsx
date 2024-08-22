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
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unable to switch to tab with name ${name}. Tab does not exist`);
          }
          return state;
        } else if (trigger.type === 'internal') {
          const name = trigger.action.payload.name;
          const shouldReset = action.payload.reset === true;
          const isLoaded = state.routes.find((route) => route.name === name);

          if (shouldReset || !isLoaded) {
            // Load the tab with the tabs specified route
            action = trigger.action;
          } else {
            // Else swap to the tab
            action = {
              type: 'JUMP_TO',
              payload: {
                name,
              },
            };
          }
        } else {
          store.navigate(trigger.href);
          return state;
        }

        return rnTabRouter.getStateForAction(state, action as any, options);
      } else {
        return rnTabRouter.getStateForAction(state, action, options);
      }
    },
  };

  return router;
}
