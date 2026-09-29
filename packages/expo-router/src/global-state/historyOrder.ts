import type { NavigationState } from '../react-navigation/routers';
import type { BrowserHistory } from './browserHistory.types';
import type { RouterRegistry, RouterRegistryEntry } from './routerRegistry';

type History = NonNullable<NavigationState['history']>;
type Origin = {
  key: string;
  order?: readonly string[];
  // Only initial state and genuinely external RESET histories can establish a baseline.
  baseline?: true;
};
export type HistoryOrders = ReadonlyMap<History, Origin>;

export function effectiveRouteNames(
  valid: string[],
  declared: readonly string[] = valid
): string[] {
  return [
    ...declared.filter((name) => valid.includes(name)),
    ...valid.filter((name) => !declared.includes(name)),
  ];
}

export function visitHistory(
  state: NavigationState,
  visit: (state: NavigationState, history: History) => void
) {
  if (state.history) visit(state, state.history);
  for (const route of state.routes) {
    if (route.state?.stale === false) visitHistory(route.state, visit);
  }
}

export function initialHistoryOrders(state: NavigationState): HistoryOrders {
  const orders = new Map<History, Origin>();
  visitHistory(state, (state, history) => orders.set(history, { key: state.key, baseline: true }));
  return orders;
}

export function observeHistoryOrders(
  orders: HistoryOrders,
  state: NavigationState,
  registry: RouterRegistry,
  history?: BrowserHistory
): HistoryOrders {
  const retained = new Map<History, Origin>();
  const visit = (state: NavigationState, history: History) => {
    let origin = orders.get(history) ?? { key: state.key };
    const entry = registry.get(state.key);
    if (
      origin.baseline &&
      entry?.declaredRouteNames &&
      (state.type === undefined || state.type === entry.routerType)
    ) {
      origin = {
        key: state.key,
        order: effectiveRouteNames(state.routeNames, entry.declaredRouteNames),
      };
    }
    retained.set(history, origin);
  };
  visitHistory(state, visit);
  for (const entry of history?.entries ?? []) visitHistory(entry.state, visit);
  return retained.size === orders.size &&
    [...retained].every(([key, value]) => orders.get(key) === value)
    ? orders
    : retained;
}

export function prepareHistory(
  state: NavigationState,
  entry: RouterRegistryEntry,
  orders: HistoryOrders
): NavigationState {
  if (!state.history?.length || !entry.prepareHistory || !entry.declaredRouteNames) return state;
  const origin = orders.get(state.history);
  const current = effectiveRouteNames(state.routeNames, entry.declaredRouteNames);
  if (origin?.key === state.key && origin.order) {
    const present = new Set(state.routes.map((route) => route.name));
    const previousOrder = origin.order.filter((name) => present.has(name));
    const currentOrder = current.filter((name) => present.has(name));
    // Moving an absent route cannot change the history of retained routes. Missing Back targets
    // are still selected from the full current declaration order by the router.
    if (
      previousOrder.length === currentOrder.length &&
      previousOrder.every((name, index) => name === currentOrder[index])
    )
      return state;
  }
  return entry.prepareHistory(state);
}

export function recordHistoryResult(
  orders: HistoryOrders,
  previous: NavigationState,
  next: NavigationState,
  entry?: RouterRegistryEntry,
  computed = false
): HistoryOrders {
  if (!next.history || next.history === previous.history || orders.has(next.history)) return orders;
  const result = new Map(orders);
  const inherited = previous.history && orders.get(previous.history);
  result.set(
    next.history,
    computed && entry?.declaredRouteNames
      ? { key: next.key, order: effectiveRouteNames(next.routeNames, entry.declaredRouteNames) }
      : inherited && !inherited.baseline
        ? inherited
        : { key: next.key }
  );
  return result;
}

export function baselineExternalReset(
  orders: HistoryOrders,
  payload: NavigationState,
  previousOrders: HistoryOrders = orders
): HistoryOrders {
  const result = new Map(orders);
  visitHistory(payload, (state, history) => {
    // Restore repair can create a history before it belongs to the live tree or a saved entry.
    if (!result.has(history))
      result.set(history, previousOrders.get(history) ?? { key: state.key, baseline: true });
  });
  return result;
}
