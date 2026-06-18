// The dumb, pure, synchronous reducer (RFC D5/D12, Decisions R-13).
//
// It does ONE thing: replace the node whose key matches `commit.key` with `commit.next`, rebuilding
// only the touched spine (untouched subtrees keep identity, enabling React bail-out). All navigation
// semantics live in the per-navigator routers (routers.ts); the reducer never interprets actions.

import type { ActionSource, GlobalNavState, NavNode, RouteEntry } from './types';

/** A committed update: the new subtree for one node, plus where it came from. The reducer ignores
 * `source`; it rides along for the render layer (Decisions P-6). */
export type NavCommit = { key: string; next: NavNode; source: ActionSource };

/** Replace the node with `key` by `next`, rebuilding the immutable spine above it. Keys are unique
 * across the tree, so the first match is the only match — stop there. */
function replaceNode(node: NavNode, key: string, next: NavNode): NavNode {
  if (node.key === key) return next;
  let found = false;
  const routes: RouteEntry[] = node.routes.map((route) => {
    if (found || !route.child) return route;
    const child = replaceNode(route.child, key, next);
    if (child === route.child) return route;
    found = true;
    return { ...route, child };
  });
  return found ? { ...node, routes } : node;
}

export function reduce(state: GlobalNavState, commit: NavCommit): GlobalNavState {
  const root = replaceNode(state.root, commit.key, commit.next);
  return root === state.root ? state : { root };
}
