import type { NavigationAction, NavigationState, PartialState, RouterConfigOptions } from './types';

// Dispatched (outside render) by `useNavigationBuilder` when a navigator's declared screens diverge
// from what's committed. Handled as a case of each router's `getStateForAction`, targeted at the
// navigator's own key.
export const RECONCILE_ROUTE_NAMES = '__unsafe_reconcile_route_names__';

export type ReconcileRouteNamesAction = NavigationAction & {
  type: typeof RECONCILE_ROUTE_NAMES;
  payload: RouterConfigOptions & {
    routeKeyChanges: string[];
    unhandledState?: NavigationState | PartialState<NavigationState>;
  };
};

// Returns the typed reconcile action, or `undefined`. A returns-value helper rather than a type
// predicate: each router's `action` union doesn't include this action, so an `action is …` guard
// would narrow `action` to `never` at those call sites.
export const asReconcileRouteNamesAction = (
  action: NavigationAction
): ReconcileRouteNamesAction | undefined =>
  action.type === RECONCILE_ROUTE_NAMES ? (action as ReconcileRouteNamesAction) : undefined;

// The unhandled-state restore path runs *instead of* the route-names-change path when the captured
// unhandled state's routes all validate against the new `routeNames` and none of the committed
// routes are in the new names. These two conditions are mutually exclusive by construction.
export function isUnhandledStateRestore(
  state: NavigationState,
  routeNames: string[],
  unhandledState: NavigationState | PartialState<NavigationState> | undefined
): unhandledState is NavigationState | PartialState<NavigationState> {
  return (
    unhandledState != null &&
    unhandledState.routes.every((r) => routeNames.includes(r.name)) &&
    state.routes.every((r) => !routeNames.includes(r.name))
  );
}
