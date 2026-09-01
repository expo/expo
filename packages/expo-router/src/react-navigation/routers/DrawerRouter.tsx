import {
  ensureFullHistory,
  type TabActionHelpers,
  TabActions,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from './TabRouter';
import { ensureStateType } from './ensureStateType';
import type { CommonNavigationAction, ParamListBase, Router } from './types';
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
   * List of previously visited route keys in `fullHistory` mode.
   */
  history?: { type: 'route'; key: string; params?: object }[];
  /** Current drawer status. When absent, the configured default is used. */
  drawerStatus?: DrawerStatus;
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
  const { backBehavior = 'firstRoute' } = rest;

  const router = TabRouter(rest) as unknown as Router<
    DrawerNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  >;

  const normalizeState = (
    state: DrawerNavigationState<ParamListBase>
  ): DrawerNavigationState<ParamListBase> => {
    const typedState = ensureStateType(state, 'drawer');
    if (backBehavior === 'fullHistory') {
      const history = typedState.history?.filter((item) => item.type === 'route');
      return ensureFullHistory({
        ...typedState,
        history,
      } as unknown as TabNavigationState<ParamListBase>) as unknown as DrawerNavigationState<ParamListBase>;
    }
    if (typedState.history === undefined) {
      return typedState;
    }
    const { history: _, ...stateWithoutHistory } = typedState;
    return stateWithoutHistory;
  };

  const setDrawerStatus = (
    state: DrawerNavigationState<ParamListBase>,
    drawerStatus: DrawerStatus
  ): DrawerNavigationState<ParamListBase> => {
    if (drawerStatus === defaultStatus) {
      if (state.drawerStatus === undefined) {
        return state;
      }
      const { drawerStatus: _, ...stateWithoutDrawerStatus } = state;
      return stateWithoutDrawerStatus;
    }
    return state.drawerStatus === drawerStatus ? state : { ...state, drawerStatus };
  };

  return {
    ...router,

    type: 'drawer',

    getStateForRouteFocus(state, key) {
      const normalizedState = normalizeState(state);
      const result = router.getStateForRouteFocus(normalizedState, key);
      return setDrawerStatus(result, defaultStatus);
    },

    getStateForAction(inputState, action, options) {
      const state = normalizeState(inputState);
      const focusedRouteKey = state.routes[state.index]?.key;

      switch (action.type) {
        case 'OPEN_DRAWER':
          return { state: setDrawerStatus(state, 'open'), affectedRouteKey: focusedRouteKey };

        case 'CLOSE_DRAWER':
          return { state: setDrawerStatus(state, 'closed'), affectedRouteKey: focusedRouteKey };

        case 'TOGGLE_DRAWER':
          return {
            state: setDrawerStatus(
              state,
              (state.drawerStatus ?? defaultStatus) === 'open' ? 'closed' : 'open'
            ),
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
              state: setDrawerStatus(
                nextState as DrawerNavigationState<ParamListBase>,
                defaultStatus
              ),
            };
          }

          return null;
        }

        case 'GO_BACK':
          if ((state.drawerStatus ?? defaultStatus) !== defaultStatus) {
            return {
              state: setDrawerStatus(state, defaultStatus),
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
