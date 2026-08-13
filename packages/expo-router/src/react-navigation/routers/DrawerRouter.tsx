import { nanoid } from 'nanoid/non-secure';

import {
  ensureStateHistory,
  type TabActionHelpers,
  TabActions,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from './TabRouter';
import { ensureStateType } from './ensureStateType';
import type { CommonNavigationAction, ParamListBase, PartialState, Router } from './types';
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
  type?: 'drawer';
  /**
   * List of previously visited route keys and drawer open status.
   */
  history?: ({ type: 'route'; key: string } | { type: 'drawer'; status: DrawerStatus })[];
};

export type DrawerActionHelpers<ParamList extends ParamListBase> = TabActionHelpers<ParamList> & {
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

/**
 * DrawerRouter is considered internal implementation and its behavior may change without a notice between expo-router's version
 */
export function DrawerRouter({
  defaultStatus = 'closed',
  ...rest
}: DrawerRouterOptions): Router<
  DrawerNavigationState<ParamListBase>,
  DrawerActionType | CommonNavigationAction
> {
  const { backBehavior = 'firstRoute', initialRouteName } = rest;

  const router = TabRouter(rest) as unknown as Router<
    DrawerNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  >;

  // `ensureStateHistory` is typed for the tab state. The drawer state differs only by the extra
  // drawer entries in `history`, which reconstruction never produces.
  const ensureDrawerStateOptionalProperties = (state: DrawerNavigationState<ParamListBase>) =>
    ensureStateHistory(
      ensureStateType(state, 'drawer') as unknown as TabNavigationState<ParamListBase>,
      backBehavior,
      initialRouteName
    ) as unknown as DrawerNavigationState<ParamListBase>;

  const isDrawerInHistory = (
    state: DrawerNavigationState<ParamListBase> | PartialState<DrawerNavigationState<ParamListBase>>
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
        ...(state.history ?? []),
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
      history: (state.history ?? []).filter((it) => it.type !== 'drawer'),
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

    getRehydratedState(partialState, { routeNames, routeGetIdList }) {
      if (partialState.stale === false) {
        return partialState;
      }

      let state = router.getRehydratedState(partialState, {
        routeNames,
        routeGetIdList,
      });

      if (isDrawerInHistory(partialState)) {
        // Re-sync the drawer entry in history to correct it if it was wrong
        state = removeDrawerFromHistory(state);
        state = addDrawerToHistory(state);
      }

      return {
        ...state,
        type: 'drawer',
        key: `drawer-${nanoid()}`,
      };
    },

    getStateForRouteFocus(state, key) {
      const result = router.getStateForRouteFocus(ensureDrawerStateOptionalProperties(state), key);

      return closeDrawer(result);
    },

    getStateForAction(inputState, action, options) {
      // Restore route history before drawer actions can add drawer-only history.
      const state = ensureDrawerStateOptionalProperties(inputState);
      const focusedRouteKey = state.routes[state.index]?.key;

      switch (action.type) {
        case 'OPEN_DRAWER':
          return { state: openDrawer(state), affectedRouteKey: focusedRouteKey };

        case 'CLOSE_DRAWER':
          return { state: closeDrawer(state), affectedRouteKey: focusedRouteKey };

        case 'TOGGLE_DRAWER':
          if (isDrawerInHistory(state)) {
            return {
              state: removeDrawerFromHistory(state),
              affectedRouteKey: focusedRouteKey,
            };
          }

          return {
            state: addDrawerToHistory(state),
            affectedRouteKey: focusedRouteKey,
          };

        case 'PUSH':
        case 'REPLACE':
        case 'JUMP_TO':
        case 'NAVIGATE': {
          const actionResult = router.getStateForAction(state, action, options);

          if (actionResult !== null) {
            const nextState = actionResult.state;
            if (nextState.index === state.index) {
              return actionResult;
            }

            return {
              ...actionResult,
              state: closeDrawer(nextState as DrawerNavigationState<ParamListBase>),
            };
          }

          return null;
        }

        case 'GO_BACK':
          if (isDrawerInHistory(state)) {
            return {
              state: removeDrawerFromHistory(state),
              affectedRouteKey: focusedRouteKey,
            };
          }

          return router.getStateForAction(state, action, options);

        default:
          return router.getStateForAction(state, action, options);
      }
    },

    actionCreators: DrawerActions,
  };
}
