import type {
  NavigationAction,
  NavigationState,
  PartialState,
  RouterBrowserHistoryAction,
} from '../react-navigation/routers';
import { prepareHistory, recordHistoryResult, type HistoryOrders } from './historyOrder';
import type { RouterRegistry } from './routerRegistry';

export type TreeNode = {
  state: NavigationState;
  parent?: TreeNode;
  parentRouteIndex?: number;
};

export type NavigationTreeIndex = {
  nodes: Map<string, TreeNode>;
  rootNode: TreeNode;
};

type Handler = {
  node: TreeNode;
  nextSlice: NavigationState;
  shouldFocus: boolean;
  accepted: boolean;
  browserHistory?: RouterBrowserHistoryAction;
  affectedRouteKey: string | undefined;
};

export type NavigationTreeReduction =
  | { handled: false }
  | {
      handled: true;
      nextState: NavigationState;
      historyOrders?: HistoryOrders;
      browserHistory?: RouterBrowserHistoryAction;
      affectedRouteKey: string | undefined;
    };

export function indexNavigationTree(root: NavigationState): NavigationTreeIndex {
  // Index parent links once so finding a handler and rebuilding its ancestors don't rescan the tree.
  assertCompleteState(root);
  const nodes = new Map<string, TreeNode>();
  const indexState = (
    state: NavigationState,
    parent?: TreeNode,
    parentRouteIndex?: number
  ): TreeNode => {
    const node = { state, parent, parentRouteIndex };
    nodes.set(state.key, node);
    state.routes.forEach((route, index) => {
      if (route.state) {
        assertCompleteState(route.state);
        indexState(route.state, node, index);
      }
    });
    return node;
  };

  return { nodes, rootNode: indexState(root) };
}

/**
 * The origin is the navigator where action handling starts before bubbling through its ancestors.
 * An explicit origin comes from the dispatching navigator; otherwise it is the deepest focused
 * navigator that has registered its router.
 */
export function resolveOrigin(
  rootNode: TreeNode,
  nodes: Map<string, TreeNode>,
  registry: RouterRegistry,
  originKey?: string
): TreeNode | undefined {
  if (originKey !== undefined) {
    const origin = nodes.get(originKey);
    return origin && registry.has(origin.state.key) ? origin : undefined;
  }

  let origin: TreeNode | undefined;
  let current: TreeNode | undefined = rootNode;
  while (current) {
    if (registry.has(current.state.key)) {
      origin = current;
    }
    // `indexNavigationTree` already proved every nested state is complete.
    const focusedState = current.state.routes[current.state.index]?.state as
      | NavigationState
      | undefined;
    current = focusedState ? nodes.get(focusedState.key) : undefined;
  }
  return origin;
}

function findActionHandler(
  origin: TreeNode,
  nodes: Map<string, TreeNode>,
  action: NavigationAction,
  registry: RouterRegistry,
  histories: { orders: HistoryOrders }
): Handler | undefined {
  let handler: Handler | undefined;
  const attempt = (node: TreeNode): boolean => {
    const entry = registry.get(node.state.key);
    if (!entry) {
      return false;
    }

    // Preparation is local until this attempt is accepted; a targeted null keeps the original.
    const previous = prepareHistory(node.state, entry, histories.orders);
    const result = entry.reduce(previous, action);
    if (result) {
      histories.orders = recordHistoryResult(histories.orders, node.state, previous, entry, true);
      histories.orders = recordHistoryResult(
        histories.orders,
        previous,
        result.state,
        entry,
        action.type !== 'RESET' || (action.payload as NavigationState | undefined)?.history == null
      );
    }
    // Unsupported untargeted actions bubble. An action explicitly addressed to this navigator
    // stops here; ancestor focus can still change, but the rejected slice stays unchanged.
    if (result === null && action.target !== node.state.key) {
      return false;
    }

    const nextSlice = result?.state ?? node.state;
    handler = {
      node,
      nextSlice,
      browserHistory: result?.browserHistory,
      shouldFocus: entry.shouldActionChangeFocus?.(action) ?? false,
      accepted: result !== null,
      affectedRouteKey: result?.affectedRouteKey,
    };
    return true;
  };

  if (typeof action.target === 'string') {
    const target = nodes.get(action.target);
    return target && attempt(target) ? handler : undefined;
  }

  for (let node: TreeNode | undefined = origin; node; node = node.parent) {
    if (attempt(node)) {
      return handler;
    }
  }

  return undefined;
}

function rebuildTreeWithSlice(
  handler: Handler,
  registry: RouterRegistry,
  histories: { orders: HistoryOrders }
) {
  let browserHistory = handler.browserHistory;
  let nextState = handler.nextSlice;
  let child = handler.node;
  while (child.parent) {
    const parent = child.parent;
    const routeIndex = child.parentRouteIndex!;
    const route = parent.state.routes[routeIndex]!;
    let nextParent =
      route.state === nextState
        ? parent.state
        : {
            ...parent.state,
            routes: parent.state.routes.map((item, index) =>
              index === routeIndex ? { ...item, state: nextState } : item
            ),
          };

    if (
      handler.shouldFocus &&
      (handler.accepted || nextParent.routes[nextParent.index]?.key !== route.key)
    ) {
      const entry = registry.get(parent.state.key);
      if (entry?.getStateForRouteFocus) {
        const previousParent = handler.accepted
          ? prepareHistory(nextParent, entry, histories.orders)
          : nextParent;
        nextParent = entry.getStateForRouteFocus(previousParent, route.key);
        histories.orders = recordHistoryResult(
          histories.orders,
          parent.state,
          previousParent,
          entry,
          true
        );
        histories.orders = recordHistoryResult(
          histories.orders,
          previousParent,
          nextParent,
          entry,
          true
        );
        const focusHistory = entry.getBrowserHistoryForRouteFocus?.(
          previousParent,
          nextParent,
          browserHistory
        );
        browserHistory = focusHistory ?? browserHistory;
      }
    }
    nextState = nextParent;
    child = parent;
  }
  return { nextState, ...(browserHistory && { browserHistory }) };
}

export function reduceNavigationTree(
  action: NavigationAction,
  registry: RouterRegistry,
  {
    origin,
    tree,
    historyOrders = new Map(),
  }: { origin: TreeNode; tree: NavigationTreeIndex; historyOrders?: HistoryOrders }
): NavigationTreeReduction {
  const histories = { orders: historyOrders };
  const handler = findActionHandler(origin, tree.nodes, action, registry, histories);
  if (!handler) {
    return { handled: false };
  }

  return {
    handled: true,
    ...rebuildTreeWithSlice(handler, registry, histories),
    historyOrders: histories.orders,
    affectedRouteKey: handler.affectedRouteKey,
  };
}

function assertCompleteState(
  state: NavigationState | PartialState<NavigationState>
): asserts state is NavigationState {
  if (state.stale !== false) {
    throw new Error(
      'Cannot reduce a stale navigation state. Expo Router requires a complete state tree before handling actions, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
    );
  }
}
