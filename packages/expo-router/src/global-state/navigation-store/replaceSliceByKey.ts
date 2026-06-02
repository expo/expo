import type { NavigationSlice, NavigationTree } from './types';

/**
 * Minimal structural view of a navigation state node. `replaceSliceByKey` only needs to walk
 * `key` / `routes` / `preloadedRoutes`; it is agnostic to the `NavigationState | PartialState`
 * discriminant (and to the per-route `name`/`params` shapes), so we relax the types internally and
 * cast at the boundary rather than fight the union over every `{ ...route }` spread.
 */
interface StateNode {
  key?: string;
  routes: RouteNode[];
  preloadedRoutes?: RouteNode[];
  [extra: string]: unknown;
}
interface RouteNode {
  state?: StateNode;
  [extra: string]: unknown;
}

/**
 * Immutably replace the navigator state whose `key` matches `targetKey` with `slice`, anywhere in
 * the nested tree, while preserving referential identity of every untouched branch (structural
 * sharing). Untouched branches keeping their identity is what lets `React.memo`'d navigators bail
 * out of re-rendering on an unrelated navigation.
 *
 * Navigation-state keys are globally unique (`stack-${nanoid()}` / `tab-${nanoid()}`), so there is
 * exactly one match; the walk short-circuits on the first one — it never aliases `slice` into two
 * positions and never traverses branches past the match.
 *
 * Returns the original `tree` reference unchanged when `targetKey` is not found, so a no-op commit
 * never invalidates memoization.
 *
 * Both `routes[].state` and (for stacks) `preloadedRoutes[].state` are searched so that nested
 * navigators rendered behind a preloaded screen are still addressable; the `preloadedRoutes` array
 * keeps its identity when nothing inside it changed (the iOS link-preview workaround in
 * `StackClient` relies on preloaded route entries staying referentially stable).
 */
export function replaceSliceByKey(
  tree: NavigationTree,
  targetKey: string,
  slice: NavigationSlice
): NavigationTree {
  // No tree yet (root not initialized) — nothing to address.
  if (!tree) {
    return tree;
  }

  // `done` short-circuits the recursion after the single match so we don't keep rebuilding
  // sibling branches (and can never install `slice` at a second colliding key).
  let done = false;

  const replaceNode = (node: StateNode): StateNode => {
    if (node.key === targetKey) {
      done = true;
      return slice as StateNode;
    }

    const nextRoutes = replaceInRoutes(node.routes);
    const nextPreloaded =
      !done && node.preloadedRoutes ? replaceInRoutes(node.preloadedRoutes) : node.preloadedRoutes;

    if (nextRoutes === node.routes && nextPreloaded === node.preloadedRoutes) {
      return node;
    }

    const next: StateNode = { ...node, routes: nextRoutes };
    if (node.preloadedRoutes) {
      next.preloadedRoutes = nextPreloaded;
    }
    return next;
  };

  const replaceInRoutes = (routes: RouteNode[]): RouteNode[] => {
    let changed = false;
    const next = routes.map((route) => {
      if (done || !route.state) {
        return route;
      }
      const nextState = replaceNode(route.state);
      if (nextState === route.state) {
        return route;
      }
      changed = true;
      return { ...route, state: nextState };
    });

    return changed ? next : routes;
  };

  return replaceNode(tree as StateNode) as NavigationTree;
}
