import type { RouteNode } from '../Route';
import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import { completeNavigationState } from './createSeededNavigationState';
import type { RouterRegistry } from './routerRegistry';

export type TreeNode = {
  state: NavigationState;
  parent?: TreeNode;
  parentRouteIndex?: number;
  parentRouteKey?: string;
};

export type NavigationTreeIndex = {
  nodes: Map<string, TreeNode>;
  rootNode: TreeNode;
};

type Handler = {
  node: TreeNode;
  nextSlice: NavigationState;
  handlerNoop: boolean;
  shouldFocus: boolean;
};

export type NavigationTreeReduction =
  | { handled: false }
  | {
      handled: true;
      handlerNoop: boolean;
      treeChanged: boolean;
      nextState: NavigationState;
      originStateKey?: string;
      target: {
        stateKey: string;
        prevSlice: NavigationState;
        nextSlice: NavigationState;
      };
    };

export function indexNavigationTree(root: NavigationState): NavigationTreeIndex {
  // Index parent links once so finding a handler and rebuilding its ancestors don't rescan the tree.
  assertCompleteState(root);
  const nodes = new Map<string, TreeNode>();
  const indexState = (
    state: NavigationState,
    parent?: TreeNode,
    parentRouteIndex?: number,
    parentRouteKey?: string
  ): TreeNode => {
    const node = { state, parent, parentRouteIndex, parentRouteKey };
    nodes.set(state.key, node);
    state.routes.forEach((route, index) => {
      if (route.state) {
        assertCompleteState(route.state);
        indexState(route.state, node, index, route.key);
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
  assertCompleteState(rootNode.state);
  if (originKey !== undefined) {
    const origin = nodes.get(originKey);
    if (origin) {
      assertCompleteState(origin.state);
    }
    return origin && registry.has(origin.state.key) ? origin : undefined;
  }

  let origin: TreeNode | undefined;
  let current: TreeNode | undefined = rootNode;
  while (current) {
    assertCompleteState(current.state);
    if (registry.has(current.state.key)) {
      origin = current;
    }
    const focusedState: NavigationState | PartialState<NavigationState> | undefined =
      current.state.routes[current.state.index]?.state;
    if (focusedState) {
      assertCompleteState(focusedState);
    }
    current = focusedState ? nodes.get(focusedState.key) : undefined;
  }
  return origin;
}

export function findActionHandler(
  origin: TreeNode,
  nodes: Map<string, TreeNode>,
  action: NavigationAction,
  registry: RouterRegistry
): Handler | undefined {
  let handler: Handler | undefined;
  const attempt = (node: TreeNode): boolean => {
    const entry = registry.get(node.state.key);
    if (!entry) {
      return false;
    }

    const result = entry.reduce(node.state, action);
    // Unsupported untargeted actions bubble. An action explicitly addressed to this navigator
    // stops here as a handled no-op instead of escaping to another navigator.
    if (result === null && action.target !== node.state.key) {
      return false;
    }

    // Router results preserve the complete state shape supplied by the registry.
    const nextSlice = (result?.state ?? node.state) as NavigationState;
    handler = {
      node,
      nextSlice,
      handlerNoop: nextSlice === node.state,
      shouldFocus: entry.shouldActionChangeFocus?.(action) ?? false,
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

export function rebuildTreeWithSlice(handler: Handler, registry: RouterRegistry): NavigationState {
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

    if (handler.shouldFocus) {
      const entry = registry.get(parent.state.key);
      if (entry?.getStateForRouteFocus) {
        nextParent = entry.getStateForRouteFocus(nextParent, route.key);
      }
    }
    nextState = nextParent;
    child = parent;
  }
  return nextState;
}

export function reduceNavigationTree(
  root: NavigationState,
  action: NavigationAction,
  registry: RouterRegistry,
  {
    originKey,
    origin,
    tree = indexNavigationTree(root),
    routeNode,
  }: {
    originKey?: string;
    origin?: TreeNode;
    tree?: NavigationTreeIndex;
    routeNode?: RouteNode;
  }
): NavigationTreeReduction {
  origin ??= resolveOrigin(tree.rootNode, tree.nodes, registry, originKey);
  if (!origin) {
    return { handled: false };
  }

  const handler = findActionHandler(origin, tree.nodes, action, registry);
  if (!handler) {
    return { handled: false };
  }

  let nextState = rebuildTreeWithSlice(handler, registry);
  if (routeNode) {
    nextState = completeNavigationState(nextState, routeNode);
  }

  let nextSlice = nextState;
  for (const routeIndex of getPathFromRoot(handler.node)) {
    // The indexed path only traverses complete child states.
    nextSlice = nextSlice.routes[routeIndex]!.state as NavigationState;
  }
  let nextOriginState: NavigationState | undefined = nextState;
  for (const routeKey of getRouteKeyPathFromRoot(origin)) {
    // The route-key path was built from complete child states in the original tree.
    const childState = nextOriginState?.routes.find((route) => route.key === routeKey)?.state as
      | NavigationState
      | undefined;
    nextOriginState = childState?.stale === false ? childState : undefined;
  }

  return {
    handled: true,
    handlerNoop: handler.handlerNoop,
    treeChanged: nextState !== root,
    nextState,
    originStateKey: nextOriginState?.key,
    target: {
      stateKey: handler.node.state.key,
      prevSlice: handler.node.state,
      nextSlice,
    },
  };
}

function getPathFromRoot(node: TreeNode): number[] {
  const path: number[] = [];
  for (let current: TreeNode | undefined = node; current.parent; current = current.parent) {
    path.unshift(current.parentRouteIndex!);
  }
  return path;
}

function getRouteKeyPathFromRoot(node: TreeNode): string[] {
  const path: string[] = [];
  for (let current: TreeNode | undefined = node; current.parent; current = current.parent) {
    path.unshift(current.parentRouteKey!);
  }
  return path;
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
