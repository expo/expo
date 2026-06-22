import { nanoid } from 'nanoid/non-secure';

import {
  type TabActionHelpers,
  TabActions,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from './TabRouter';
import type { CommonNavigationAction, ParamListBase, Router } from './types';

export type DrawerStatus = 'open' | 'closed';

export type DrawerActionType = TabActionType;

export type DrawerRouterOptions = TabRouterOptions & {
  defaultStatus?: DrawerStatus;
};

// Drawer state has the same shape as tab state. The drawer's open/closed status is owned by the
// drawer navigator's local React state, not stored in navigation state.
export type DrawerNavigationState<ParamList extends ParamListBase> = TabNavigationState<ParamList>;

export type DrawerActionHelpers<ParamList extends ParamListBase> = TabActionHelpers<ParamList>;

/**
 * DrawerRouter is considered internal implementation and its behavior may change without a notice between expo-router's version
 */
export function DrawerRouter(
  options: DrawerRouterOptions
): Router<DrawerNavigationState<ParamListBase>, DrawerActionType | CommonNavigationAction> {
  const router = TabRouter(options) as unknown as Router<
    DrawerNavigationState<ParamListBase>,
    DrawerActionType | CommonNavigationAction
  >;

  return {
    ...router,

    getInitialState({ routeNames, routeParamList, routeGetIdList }) {
      const state = router.getInitialState({ routeNames, routeParamList, routeGetIdList });

      return { ...state, key: `drawer-${nanoid()}` };
    },

    getRehydratedState(partialState, { routeNames, routeParamList, routeGetIdList }) {
      if (partialState.stale === false) {
        return partialState;
      }

      const state = router.getRehydratedState(partialState, {
        routeNames,
        routeParamList,
        routeGetIdList,
      });

      return { ...state, key: `drawer-${nanoid()}` };
    },

    actionCreators: TabActions,
  };
}
