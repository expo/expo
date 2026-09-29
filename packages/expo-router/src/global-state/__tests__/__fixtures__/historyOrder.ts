import {
  DrawerRouter,
  TabRouter,
  type NavigationAction,
  type NavigationState,
  type TabRouterOptions,
} from '../../../react-navigation/routers';
import {
  effectiveRouteNames,
  initialHistoryOrders,
  observeHistoryOrders,
} from '../../historyOrder';
import type { RouterRegistryEntry } from '../../routerRegistry';
import { navigationTreeReducer, type NavigationTreeResult } from '../../useNavigationTreeReducer';

export const A = ['bar', 'baz', 'qux'];
export const B = ['baz', 'bar', 'qux'];
export function state(): NavigationState {
  return {
    key: 'root',
    type: 'tab',
    stale: false,
    routeKeySeq: 3,
    routeNames: A,
    index: 2,
    routes: A.map((name) => ({ key: name, name })),
    history: [
      { type: 'route', key: 'bar' },
      { type: 'route', key: 'qux' },
    ],
  };
}
export function entry(
  order: string[],
  options: TabRouterOptions = { backBehavior: 'order' },
  drawer = false
): RouterRegistryEntry {
  const router = drawer ? DrawerRouter(options) : TabRouter(options);
  const names = (state: NavigationState) => effectiveRouteNames(state.routeNames, order);
  return {
    routerType: router.type,
    declaredRouteNames: order,
    prepareHistory: (state) =>
      router.getStateForRouteConfigChange(state as never, {
        routeNames: state.routeNames,
        declaredRouteNames: names(state),
        repairHistory: true,
        orderOnly: true,
      }),
    getStateForRouteConfigChange: (state, routeNames, repairHistory) =>
      router.getStateForRouteConfigChange(state as never, {
        routeNames,
        declaredRouteNames: effectiveRouteNames(routeNames, order),
        repairHistory,
      }),
    reduce: (state, action) =>
      router.getStateForAction(state as never, action as never, {
        routeNames: names(state),
        routeGetIdList: {},
      }),
    shouldActionChangeFocus: router.shouldActionChangeFocus,
    getStateForRouteFocus: (state, key) =>
      router.getStateForRouteFocus(state as never, key, { routeNames: names(state) }),
    getBrowserHistoryForRouteFocus: (previous, next, child) =>
      router.getBrowserHistoryForRouteFocus?.(previous as never, next as never, child, {
        routeNames: names(previous),
      }),
  };
}
export function config(
  order = A,
  options?: TabRouterOptions,
  drawer = false
): Parameters<typeof navigationTreeReducer>[2] {
  return {
    registry: new Map([['root', entry(order, options, drawer)]]),
    routesWithRemovalPrevented: new Set(),
    browserHistoryIdPrefix: 'test',
  };
}
export function result(input = state(), current = config()): NavigationTreeResult {
  return {
    state: input,
    historyOrders: observeHistoryOrders(initialHistoryOrders(input), input, current.registry),
    report: undefined,
    eventSeq: 0,
    history: undefined,
  };
}
export function action(
  previous: NavigationTreeResult,
  action: NavigationAction,
  current = config()
): NavigationTreeResult {
  return navigationTreeReducer(previous, { type: 'ACTION', payload: { action } }, current);
}
export function keys(value: NavigationState): string[] {
  return ((value.history as { type: string; key: string }[]) ?? [])
    .filter((item) => item.type === 'route')
    .map((item) => item.key);
}
