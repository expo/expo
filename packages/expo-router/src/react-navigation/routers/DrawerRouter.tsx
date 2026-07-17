import {
  type TabActionHelpers,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from './TabRouter';
import { asFocusChildAction } from './focusChild';
import { asReconcileRouteNamesAction, isUnhandledStateRestore } from './reconcileRouteNames';
import type { CommonNavigationAction, InternalRouter, ParamListBase } from './types';

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

export type DrawerNavigationState<ParamList extends ParamListBase> =
  TabNavigationState<ParamList> & {
    drawerStatus: DrawerStatus;
  };

export type DrawerActionHelpers<ParamList extends ParamListBase> = TabActionHelpers<ParamList> & {
  openDrawer(): void;
  closeDrawer(): void;
  toggleDrawer(): void;
};

export const DrawerActions = {
  openDrawer() {
    return { type: 'OPEN_DRAWER' } as const;
  },
  closeDrawer() {
    return { type: 'CLOSE_DRAWER' } as const;
  },
  toggleDrawer() {
    return { type: 'TOGGLE_DRAWER' } as const;
  },
};

function withDrawerStatus<State extends TabNavigationState<ParamListBase>>(
  state: State,
  defaultStatus: DrawerStatus
): State & { drawerStatus: DrawerStatus } {
  if ((state as State & { drawerStatus?: DrawerStatus }).drawerStatus != null) {
    return state as State & { drawerStatus: DrawerStatus };
  }

  return {
    ...state,
    drawerStatus: defaultStatus,
  };
}

/**
 * DrawerRouter is considered internal implementation and its behavior may change without a notice between expo-router's version.
 *
 * Documented deviation from the global-state invariants (decided, not accidental): the drawer keeps
 * its open/closed state as a navigator-owned scalar `drawerStatus` on the navigation state, and
 * `GO_BACK` closes an open drawer before the positional back walk. This intentionally departs from
 * the "reducers only remove/reorder/refocus routes" and "uniform back" invariants the store refactor
 * is built on, because it mirrors upstream React Navigation's DrawerRouter and `drawerStatus` is
 * orthogonal UI state, not a route/index/focus change. The rejected alternative — modelling the open
 * drawer as a route — would diverge from upstream, force the compiler/linking to give a UI toggle a
 * URL, and over-model a boolean. `drawerStatus` is deliberately left out of the compiler seed (it is
 * a React-only concern); an absent field reads as the default (see `effectiveStatus` below).
 */
export function DrawerRouter({
  defaultStatus = 'closed',
  ...options
}: DrawerRouterOptions): InternalRouter<
  DrawerNavigationState<ParamListBase>,
  DrawerActionType | CommonNavigationAction
> {
  const tabRouter = TabRouter(options);

  return {
    ...tabRouter,

    getInitialState(config) {
      return withDrawerStatus(tabRouter.getInitialState(config), defaultStatus);
    },

    getStateForAction(state, action, config) {
      if (action.target && action.target !== state.key) {
        return null;
      }

      // Focus delegates to the tab router's handling, then re-applies drawerStatus the same way the
      // former `getStateForRouteFocus` did.
      const focusChildAction = asFocusChildAction(action);
      if (focusChildAction) {
        const tabResult = tabRouter.getStateForAction(
          state,
          action as unknown as CommonNavigationAction,
          config
        );
        return tabResult == null
          ? null
          : withDrawerStatus(tabResult as DrawerNavigationState<ParamListBase>, defaultStatus);
      }

      // Reconcile delegates to the tab router's handling, then re-applies drawerStatus the same way
      // the tab-shaped result is wrapped elsewhere: the route-names-change branch spreads the current
      // state (so it already carries `drawerStatus`), while the unhandled-restore branch produces a
      // fresh state whose status comes from the restored unhandled state (default when absent).
      const reconcile = asReconcileRouteNamesAction(action);
      if (reconcile) {
        // The reconcile action is handled by every router's `getStateForAction` but isn't part of any
        // router's public action union, so it needs a cast to reach the tab router's handling.
        const tabResult = tabRouter.getStateForAction(
          state,
          reconcile as unknown as CommonNavigationAction,
          config
        );
        if (tabResult == null) {
          return null;
        }
        const source = isUnhandledStateRestore(
          state,
          reconcile.payload.routeNames,
          reconcile.payload.unhandledState
        )
          ? reconcile.payload.unhandledState
          : state;
        return withDrawerStatus(
          tabResult as DrawerNavigationState<ParamListBase>,
          (source as Partial<DrawerNavigationState<ParamListBase>>).drawerStatus ?? defaultStatus
        );
      }

      // Compiler-seeded complete states omit `drawerStatus` (navigator kind lives only in React), so
      // treat an absent field as the default. Without this the first GO_BACK on a compiled drawer
      // state would be swallowed merely to materialize the default, and CLOSE/OPEN at the default
      // would spuriously report a change.
      const effectiveStatus = state.drawerStatus ?? defaultStatus;

      switch (action.type) {
        case 'OPEN_DRAWER':
          return effectiveStatus === 'open' ? state : { ...state, drawerStatus: 'open' };
        case 'CLOSE_DRAWER':
          return effectiveStatus === 'closed' ? state : { ...state, drawerStatus: 'closed' };
        case 'TOGGLE_DRAWER':
          return { ...state, drawerStatus: effectiveStatus === 'open' ? 'closed' : 'open' };
        case 'GO_BACK':
          if (effectiveStatus !== defaultStatus) {
            return { ...state, drawerStatus: defaultStatus };
          }
          break;
      }

      const nextState = tabRouter.getStateForAction(state, action, config);

      if (nextState == null) {
        return nextState;
      }

      const nextDrawerState = withDrawerStatus(
        nextState as DrawerNavigationState<ParamListBase>,
        defaultStatus
      );

      const focusedRouteChanged =
        nextDrawerState.index !== state.index ||
        nextDrawerState.routes[nextDrawerState.index]?.key !== state.routes[state.index]?.key;

      if (action.type !== 'GO_BACK' && focusedRouteChanged) {
        return { ...nextDrawerState, drawerStatus: defaultStatus };
      }

      return nextDrawerState;
    },

    actionCreators: {
      ...tabRouter.actionCreators,
      ...DrawerActions,
    },
  };
}
