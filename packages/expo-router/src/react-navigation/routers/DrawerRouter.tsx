import { nanoid } from 'nanoid/non-secure';

import {
  type TabActionHelpers,
  TabActions,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from './TabRouter';
import type {
  CommonNavigationAction,
  ParamListBase,
  PartialState,
  Router,
} from './types';
export type DrawerStatus = 'open' | 'closed';

export type DrawerActionType =
  | TabActionType
  | {
      type: 'OPEN_DRAWER' | 'CLOSE_DRAWER' | 'TOGGLE_DRAWER';
      source?: string;
      target?: string;
    };

export type DrawerRouterOptions = TabRouterOptions & {
  defaultStatus?: DrawerStatus;
};

export type DrawerNavigationState<ParamList extends ParamListBase> = Omit<
  TabNavigationState<ParamList>,
  'type' | 'history'
> & {
  /**
   * Type of the router, in this case, it's drawer.
   */
  type: 'drawer';
  /**
   * Default status of the drawer.
   */
  default: DrawerStatus;
  /**
   * List of previously visited route keys and drawer open status.
   */
  history: (
    | { type: 'route'; key: string }
    | { type: 'drawer'; status: DrawerStatus }
  )[];
};

export type DrawerActionHelpers<ParamList extends ParamListBase> =
  TabActionHelpers<ParamList> & {
    /**
     * Open the drawer sidebar.
     */
    openDrawer(): void;

    /**
     * Close the drawer sidebar.
     */
    closeDrawer(): void;

    /**
     * Open the drawer sidebar if closed, or close if opened.
     */
    toggleDrawer(): void;
  };

export const DrawerActions = {
  ...TabActions,
  openDrawer() {
    return { type: 'OPEN_DRAWER' } as const satisfies DrawerActionType;
  },
  closeDrawer() {
    return { type: 'CLOSE_DRAWER' } as const satisfies DrawerActionType;
  },
  toggleDrawer() {
    return { type: 'TOGGLE_DRAWER' } as const satisfies DrawerActionType;
  },
};

export function DrawerRouter({
  defaultStatus = 'closed',
  ...rest
}: DrawerRouterOptions): Router<
  DrawerNavigationState<ParamListBase>,
  DrawerActionType | CommonNavigationAction
> {
  const router = TabRouter(rest) as unknown as Router<
    DrawerNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  >;

  const isDrawerInHistory = (
    state:
      | DrawerNavigationState<ParamListBase>
      | PartialState<DrawerNavigationState<ParamListBase>>
  ) => Boolean(state.history?.some((it) => it.type === 'drawer'));

  const addDrawerToHistory = (
    state: DrawerNavigationState<ParamListBase>
  ): DrawerNavigationState<ParamListBase> => {
    if (isDrawerInHistory(state)) {
      return state;
    }

    return {
      ...state,
      history: [
        ...state.history,
        {
          type: 'drawer',
          status: defaultStatus === 'open' ? 'closed' : 'open',
        },
      ],
    };
  };

  const removeDrawerFromHistory = (
    state: DrawerNavigationState<ParamListBase>
  ): DrawerNavigationState<ParamListBase> => {
    if (!isDrawerInHistory(state)) {
      return state;
    }

    return {
      ...state,
      history: state.history.filter((it) => it.type !== 'drawer'),
    };
  };

  const openDrawer = (
    state: DrawerNavigationState<ParamListBase>
  ): DrawerNavigationState<ParamListBase> => {
    if (defaultStatus === 'open') {
      return removeDrawerFromHistory(state);
    }

    return addDrawerToHistory(state);
  };

  const closeDrawer = (
    state: DrawerNavigationState<ParamListBase>
  ): DrawerNavigationState<ParamListBase> => {
    if (defaultStatus === 'open') {
      return addDrawerToHistory(state);
    }

    return removeDrawerFromHistory(state);
  };

  return {
    ...router,

    type: 'drawer',

    getInitialState({ routeNames, routeParamList, routeGetIdList }) {
      const state = router.getInitialState({
        routeNames,
        routeParamList,
        routeGetIdList,
      });

      return {
        ...state,
        default: defaultStatus,
        stale: false,
        type: 'drawer',
        key: `drawer-${nanoid()}`,
      };
    },

    getRehydratedState(
      partialState,
      { routeNames, routeParamList, routeGetIdList }
    ) {
      if (partialState.stale === false) {
        return partialState;
      }

      let state = router.getRehydratedState(partialState, {
        routeNames,
        routeParamList,
        routeGetIdList,
      });

      if (isDrawerInHistory(partialState)) {
        // Re-sync the drawer entry in history to correct it if it was wrong
        state = removeDrawerFromHistory(state);
        state = addDrawerToHistory(state);
      }

      return {
        ...state,
        default: defaultStatus,
        type: 'drawer',
        key: `drawer-${nanoid()}`,
      };
    },

    getStateForRouteFocus(state, key) {
      const result = router.getStateForRouteFocus(state, key);

      return closeDrawer(result);
    },

    getStateForAction(state, action, options) {
      switch (action.type) {
        case 'OPEN_DRAWER':
          return openDrawer(state);

        case 'CLOSE_DRAWER':
          return closeDrawer(state);

        case 'TOGGLE_DRAWER':
          if (isDrawerInHistory(state)) {
            return removeDrawerFromHistory(state);
          }

          return addDrawerToHistory(state);

        case 'JUMP_TO':
        case 'NAVIGATE':
        case 'NAVIGATE_DEPRECATED': {
          const result = router.getStateForAction(state, action, options);

          if (result != null && result.index !== state.index) {
            return closeDrawer(result as DrawerNavigationState<ParamListBase>);
          }

          return result;
        }

        case 'GO_BACK':
          if (isDrawerInHistory(state)) {
            return removeDrawerFromHistory(state);
          }

          return router.getStateForAction(state, action, options);

        default:
          return router.getStateForAction(state, action, options);
      }
    },

    actionCreators: DrawerActions,
  };
}
