import {
  findRouteNodeByName,
  getValidInitialRouteName,
  sortRoutesWithInitial,
  type RouteNode,
} from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
import type { NavigationState } from '../react-navigation/routers';
import { getStackRoutes } from '../react-navigation/routers/StackRouter';
import { createRouteKeyMinter, getChainFromRouteKey } from '../react-navigation/routers/stateKeys';
import { createSeededNavigationState } from './createSeededNavigationState';
import { getRootStackRouteNames } from './utils';

type NavigationRoute = NavigationState['routes'][number];
type RouteHistoryItem = { type: 'route'; key: string; params?: object };
type StackState = NavigationState & { type: 'stack' };

export function reconcileRoutes(state: NavigationState, routeNode: RouteNode): NavigationState {
  return reconcileLevel(
    state,
    getRootStackRouteNames(),
    undefined,
    (routeName) => (routeName === INTERNAL_SLOT_NAME ? routeNode : undefined),
    true
  );
}

function reconcileLevel(
  state: NavigationState,
  routeNames: string[],
  initialRouteName: string | undefined,
  findChildNode: (routeName: string) => RouteNode | undefined,
  reconcileEmptyChildren = false
): NavigationState {
  const declaredRouteNames = new Set(routeNames);
  const focusedKey = state.routes[state.index]?.key;
  const minter = createRouteKeyMinter(state);

  const reconcileRoute = (route: NavigationRoute): NavigationRoute => {
    const childNode = findChildNode(route.name);
    if (!childNode) {
      return route;
    }
    if (childNode.children.length === 0 && !reconcileEmptyChildren) {
      if (route.state === undefined) {
        return route;
      }
      const { state: _, ...routeWithoutState } = route;
      return routeWithoutState;
    }

    const childInitialRouteName = getValidInitialRouteName(childNode);
    const childRouteNames = [...childNode.children]
      .sort(sortRoutesWithInitial(childInitialRouteName))
      .map((child) => child.route);
    const childState =
      route.state?.stale === false
        ? reconcileLevel(route.state, childRouteNames, childInitialRouteName, (routeName) =>
            findRouteNodeByName(childNode, routeName)
          )
        : createSeededNavigationState(route.state, childNode, getChainFromRouteKey(route.key));

    return childState === route.state ? route : { ...route, state: childState };
  };

  const createFallbackRoute = (name: string): NavigationRoute => {
    const route: NavigationRoute = { key: minter.mint(name), name };
    const childNode = findChildNode(name);
    return childNode?.children.length
      ? {
          ...route,
          state: createSeededNavigationState(undefined, childNode, getChainFromRouteKey(route.key)),
        }
      : route;
  };

  let routes: NavigationRoute[];
  let index: number;

  if (isStackState(state)) {
    const { activeRoutes, preloadedRoutes } = getStackRoutes(state);
    const nextActiveRoutes = activeRoutes
      .filter((route) => declaredRouteNames.has(route.name))
      .map(reconcileRoute);
    let nextPreloadedRoutes = preloadedRoutes
      .filter((route) => declaredRouteNames.has(route.name))
      .map(reconcileRoute);

    if (nextActiveRoutes.length === 0) {
      const fallbackName = initialRouteName ?? routeNames[0];
      if (fallbackName !== undefined) {
        const preloadedIndex = nextPreloadedRoutes.findIndex(
          (route) => route.name === fallbackName
        );
        const fallbackRoute =
          preloadedIndex === -1
            ? createFallbackRoute(fallbackName)
            : nextPreloadedRoutes[preloadedIndex]!;
        nextActiveRoutes.push(fallbackRoute);
        nextPreloadedRoutes = nextPreloadedRoutes.filter(
          (route) => route.key !== fallbackRoute.key
        );
      }
    }

    const activeKeys = new Set(nextActiveRoutes.map((route) => route.key));
    routes = nextActiveRoutes.concat(
      nextPreloadedRoutes.filter((route) => !activeKeys.has(route.key))
    );
    index = nextActiveRoutes.length - 1;
  } else {
    routes = state.routes.filter((route) => declaredRouteNames.has(route.name)).map(reconcileRoute);

    if (routes.length === 0) {
      const fallbackName = initialRouteName ?? routeNames[0];
      if (fallbackName !== undefined) {
        routes = [createFallbackRoute(fallbackName)];
      }
    }

    const focusedIndex = routes.findIndex((route) => route.key === focusedKey);
    index = routes.length === 0 ? -1 : Math.max(focusedIndex, 0);
  }

  const history = reconcileHistory(state, routes, index, focusedKey);
  const routesChanged =
    routes.length !== state.routes.length ||
    routes.some((route, routeIndex) => route !== state.routes[routeIndex]);

  if (
    !routesChanged &&
    index === state.index &&
    minter.routeKeySeq === state.routeKeySeq &&
    isArrayEqual(routeNames, state.routeNames) &&
    history === state.history
  ) {
    return state;
  }

  return {
    ...state,
    routeKeySeq: minter.routeKeySeq,
    routeNames,
    routes,
    index,
    ...(history === state.history ? undefined : { history }),
  };
}

function isStackState(state: NavigationState): state is StackState {
  return state.type === 'stack';
}

function reconcileHistory(
  state: NavigationState,
  routes: NavigationRoute[],
  index: number,
  focusedKey: string | undefined
): NavigationState['history'] {
  if ((state.type !== 'tab' && state.type !== 'drawer') || !isRouteHistory(state.history)) {
    return state.history;
  }

  const routeKeys = new Set(routes.map((route) => route.key));
  let history = state.history.filter((item) => routeKeys.has(item.key));
  const historyChanged = history.length !== state.history.length;

  if (routes.length === 0) {
    return historyChanged ? history : state.history;
  }
  if (routeKeys.has(focusedKey ?? '')) {
    return historyChanged ? history : state.history;
  }

  const currentRoute = routes[index]!;
  const lastRouteIndex = history.findLastIndex((item) => item.type === 'route');
  if (history[lastRouteIndex]?.key === currentRoute.key) {
    history = [...history.slice(0, lastRouteIndex), ...history.slice(lastRouteIndex + 1)];
  }
  return history.concat({
    type: 'route',
    key: currentRoute.key,
    params: currentRoute.params,
  });
}

function isRouteHistory(history: NavigationState['history']): history is RouteHistoryItem[] {
  return (
    Array.isArray(history) &&
    history.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        item.type === 'route' &&
        'key' in item &&
        typeof item.key === 'string'
    )
  );
}
