// Tree navigation helpers over the homogeneous tree.

import type { NavNode } from './types';

/** Behavior-lookup key for the root navigator (which hosts no owning route). */
export const ROOT_NAME = '__root__';

// The behavior of a node is looked up by the name that hosts it: `ROOT_NAME` for the root, else the
// owning route's name. This is a stand-in: route names are not unique across branches, so the
// production manifest will key by `contextKey`/layout path (Decisions P-4/P-12 note). Adequate while
// the lookup is an injected input here.
type FocusedNode = { node: NavNode; name: string };

/** The chain of nodes along the focused path, outermost (root) first, innermost (leaf) last. */
export function focusedChain(root: NavNode): FocusedNode[] {
  const chain: FocusedNode[] = [{ node: root, name: ROOT_NAME }];
  let node = root;
  for (;;) {
    const route = node.routes[node.index];
    if (!route?.child) return chain;
    chain.push({ node: route.child, name: route.name });
    node = route.child;
  }
}
