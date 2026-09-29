import {
  findRouteNodeByName,
  getValidInitialRouteName,
  sortRoutesWithInitial,
  type RouteNode,
} from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
import type { NavigationState } from '../react-navigation/routers';
import { createRouteKeyMinter, getChainFromRouteKey } from '../react-navigation/routers/stateKeys';
import { createSeededNavigationState } from './createSeededNavigationState';
import type { RouterRegistry, RouterRegistryEntry } from './routerRegistry';
import { getRootStackRouteNames } from './utils';

// An entry records which committed router already saw the change. A replacement registration
// can finish repair with its own mount-scoped options; normal registration creates no work.
export type PendingRouteConfig = ReadonlyMap<string, RouterRegistryEntry | undefined>;

export function reconcileRouteConfig(
  state: NavigationState,
  root: RouteNode,
  registry: RouterRegistry,
  pending: PendingRouteConfig = new Map(),
  adopt = false,
  recordHistory?: (
    previous: NavigationState,
    next: NavigationState,
    entry: RouterRegistryEntry | undefined,
    computed: boolean
  ) => void
): { state: NavigationState; pending: PendingRouteConfig } {
  const nextPending = new Map(pending);
  const visited = new Set<string>();

  function visit(input: NavigationState, node: RouteNode, synthetic = false): NavigationState {
    visited.add(input.key);
    const initialRouteName = synthetic ? undefined : getValidInitialRouteName(node);
    const routeNames = synthetic
      ? getRootStackRouteNames()
      : [...node.children]
          .sort(sortRoutesWithInitial(initialRouteName))
          .map((child) => child.route);
    const entry = registry.get(input.key);
    const compatible =
      entry?.getStateForRouteConfigChange &&
      (input.type === undefined || input.type === entry.routerType);
    const structural =
      !isArrayEqual(input.routeNames, routeNames) ||
      input.routes.some((route) => !routeNames.includes(route.name));
    const adoption = adopt && nextPending.has(input.key) && entry !== nextPending.get(input.key);
    let current = input;
    if (compatible && (structural || adoption)) {
      current = entry.getStateForRouteConfigChange!(input, routeNames, adoption);
      if (adoption) nextPending.delete(input.key);
    } else if (structural) {
      const routes = input.routes.filter((route) => routeNames.includes(route.name));
      const active = routes.filter((route) => !route.isPreloaded);
      let index =
        input.type === 'stack'
          ? routes.indexOf(active[active.length - 1]!)
          : routes.findIndex((route) => route.key === input.routes[input.index]?.key);
      if (index < 0 && active.length > 0) index = routes.indexOf(active[0]!);
      let routeKeySeq = input.routeKeySeq;
      if (active.length === 0 && routeNames.length > 0) {
        const name = initialRouteName ?? routeNames[0]!;
        index = routes.findIndex((route) => route.name === name);
        if (index === -1) {
          const minter = createRouteKeyMinter(input);
          routes.unshift({ key: minter.mint(name), name });
          routeKeySeq = minter.routeKeySeq;
          index = 0;
        } else if (routes[index]!.isPreloaded) {
          const { isPreloaded, ...route } = routes[index]!;
          if (input.type === 'stack') {
            routes.splice(index, 1);
            routes.unshift(route);
            index = 0;
          } else {
            routes[index] = route;
          }
        }
      }
      const keys = new Set(routes.map((route) => route.key));
      let history = input.history?.filter(
        (item) => !isRouteHistory(item) || (typeof item.key === 'string' && keys.has(item.key))
      );
      const focusedRoute = routes[index];
      if (
        history &&
        focusedRoute &&
        (input.type === 'tab' || input.type === 'drawer') &&
        !keys.has(input.routes[input.index]?.key ?? '')
      ) {
        const routeHistory = history.filter(isRouteHistory);
        const nonRouteHistory = history.filter((item) => !isRouteHistory(item));
        if (routeHistory[routeHistory.length - 1]?.key === focusedRoute.key) routeHistory.pop();
        // Keep repeated visits until the mounted router can apply its own back behavior.
        history = [
          ...routeHistory,
          { type: 'route', key: focusedRoute.key, params: focusedRoute.params },
          ...nonRouteHistory,
        ];
      }
      current = {
        ...input,
        routeNames,
        routes,
        routeKeySeq,
        index: routes.length ? Math.max(0, index) : -1,
        ...(history ? { history } : undefined),
      };
    }
    recordHistory?.(input, current, entry, Boolean(compatible));
    if (structural) nextPending.set(input.key, compatible ? entry : undefined);

    let changed = false;
    const routes = current.routes.map((route) => {
      const child = synthetic
        ? route.name === INTERNAL_SLOT_NAME
          ? root
          : undefined
        : findRouteNodeByName(node, route.name);
      if (!child || child.children.length === 0) {
        if (!route.state) return route;
        changed = true;
        const { state: obsoleteState, ...leaf } = route;
        return leaf;
      }
      let childState: NavigationState;
      if (route.state?.stale === false) {
        childState = visit(route.state, child);
      } else {
        childState = createSeededNavigationState(undefined, child, getChainFromRouteKey(route.key));
        const markSeeded = (seed: NavigationState) => {
          visited.add(seed.key);
          nextPending.set(seed.key, undefined);
          for (const childRoute of seed.routes) {
            if (childRoute.state?.stale === false) markSeeded(childRoute.state);
          }
        };
        markSeeded(childState);
      }
      if (childState === route.state) return route;
      changed = true;
      return { ...route, state: childState };
    });
    return changed ? { ...current, routes } : current;
  }
  const next = visit(state, root, true);
  for (const key of nextPending.keys()) {
    if (!visited.has(key)) nextPending.delete(key);
  }
  const unchangedPending =
    pending.size === nextPending.size &&
    [...pending].every(([key, entry]) => nextPending.has(key) && nextPending.get(key) === entry);
  return { state: next, pending: unchangedPending ? pending : nextPending };
}

/** Resolves a mounted layout from the live tree, never from a retired registry entry. */
export function findCurrentRouteNode(
  state: NavigationState,
  root: RouteNode,
  key: string
): RouteNode | undefined {
  function visit(
    current: NavigationState,
    node: RouteNode,
    synthetic = false
  ): RouteNode | undefined {
    if (current.key === key) return synthetic ? undefined : node;
    for (const route of current.routes) {
      const child = synthetic
        ? route.name === INTERNAL_SLOT_NAME
          ? root
          : undefined
        : findRouteNodeByName(node, route.name);
      if (child?.children.length && route.state?.stale === false) {
        const found = visit(route.state, child);
        if (found) return found;
      }
    }
    return undefined;
  }
  return visit(state, root, true);
}

function isRouteHistory(item: unknown): item is { type: 'route'; key?: unknown } {
  return typeof item === 'object' && item !== null && 'type' in item && item.type === 'route';
}
