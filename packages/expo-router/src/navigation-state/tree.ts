// Tree navigation helpers over the homogeneous tree.

import type { NavNode } from './types';

/** The chain of nodes along the focused path, outermost (root) first, innermost (leaf) last.
 * Back-bubbling walks this leaf→root, looking each node's router up by `node.key`. */
export function focusedChain(root: NavNode): NavNode[] {
  const chain: NavNode[] = [root];
  let node = root;
  for (;;) {
    const route = node.routes[node.index];
    if (!route?.child) return chain;
    chain.push(route.child);
    node = route.child;
  }
}
