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
import { Href } from '../types';

export type TabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

export type TabActionType<T extends string | object> =
  | RNTabActionType
  | CommonNavigationAction
  | {
      type: 'SWITCH_TABS';
      payload: { name: string; href?: Href<T> };
      source?: string;
      target?: string;
    };

export function TabRouter({ triggerMap, ...options }: TabRouterOptions) {
  const rnTabRouter = RNTabRouter(options);

  const router: Router<
    TabNavigationState<ParamListBase>,
    TabActionType<any> | CommonNavigationAction
  > = {
    ...rnTabRouter,
    getStateForAction(state, action, options) {
      if (action.type === 'SWITCH_TABS') {
        const name = action.payload.name;
        const payload = triggerMap.get(name);

        if (!payload) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unable to switch to tab with name ${name}. Tab does not exist`);
          }
          return state;
        }

        action = {
          type: 'JUMP_TO',
          ...payload.navigate,
        };

        return rnTabRouter.getStateForAction(state, action as any, options);
      } else {
        return rnTabRouter.getStateForAction(state, action, options);
      }
    },
  };

  return router;
}
