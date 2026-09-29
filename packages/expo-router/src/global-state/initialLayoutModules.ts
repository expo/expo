import { findRouteNodeByName, type RouteNode } from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { isThenable } from '../getRoutesCore';

/**
 * The layouts whose `unstable_settings` seed the initial navigation state for `state`: the root
 * layout and every layout on the focused path of the state parsed from the initial URL. Without a
 * parsed state the navigators start on their default routes, which any layout can affect.
 */
export function getLayoutNodesForState(
  rootRouteNode: RouteNode,
  state: ResultState | undefined
): RouteNode[] {
  if (!state) {
    return getAllLayoutNodes(rootRouteNode);
  }

  const layouts = [rootRouteNode];
  let node = rootRouteNode;
  let current: ResultState | undefined = state;

  while (current) {
    const route = current.routes[current.index ?? current.routes.length - 1];
    if (!route) {
      break;
    }
    // The parsed state wraps the app in the internal root slot, which maps to the root layout.
    if (route.name === INTERNAL_SLOT_NAME) {
      current = route.state;
      continue;
    }
    const child = findRouteNodeByName(node, route.name);
    if (!child) {
      break;
    }
    if (child.type === 'layout') {
      layouts.push(child);
    }
    node = child;
    current = route.state;
  }

  return layouts;
}

/** Every layout in the route tree, depth first. */
export function getAllLayoutNodes(node: RouteNode, layouts: RouteNode[] = []): RouteNode[] {
  if (node.type === 'layout') {
    layouts.push(node);
    for (const child of node.children) {
      getAllLayoutNodes(child, layouts);
    }
  }
  return layouts;
}

/**
 * Start loading the modules of `layouts` and return the ones that are not available yet. In the
 * `lazy` import mode `loadRoute()` returns a promise until the route's split bundle is registered.
 */
export function getPendingLayoutModules(layouts: RouteNode[]): PromiseLike<unknown>[] {
  const pending: PromiseLike<unknown>[] = [];
  for (const layout of layouts) {
    const loaded: unknown = layout.loadRoute();
    if (isThenable(loaded)) {
      pending.push(loaded);
    }
  }
  return pending;
}
