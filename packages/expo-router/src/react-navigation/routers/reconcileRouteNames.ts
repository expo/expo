import type { NavigationAction, RouterConfigOptions } from './types';

// Dispatched (outside render) by `useNavigationBuilder` when a navigator's declared screens diverge
// from what's committed. Handled as a case of each router's `getStateForAction`, targeted at the
// navigator's own key.
export const RECONCILE_ROUTE_NAMES = '__unsafe_reconcile_route_names__';

export type ReconcileRouteNamesAction = NavigationAction & {
  type: typeof RECONCILE_ROUTE_NAMES;
  payload: RouterConfigOptions & {
    routeKeyChanges: string[];
  };
};

// Returns the typed reconcile action, or `undefined`. A returns-value helper rather than a type
// predicate: each router's `action` union doesn't include this action, so an `action is …` guard
// would narrow `action` to `never` at those call sites.
export const asReconcileRouteNamesAction = (
  action: NavigationAction
): ReconcileRouteNamesAction | undefined =>
  action.type === RECONCILE_ROUTE_NAMES ? (action as ReconcileRouteNamesAction) : undefined;
