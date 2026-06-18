// Render-free back-bubbling (RFC scenario 5/6, Decisions R-13/P-8).
//
// Bubble the focused chain leaf→root: run each node's registered router with `goBack`; the first that
// returns a new subtree handles it. A node that can't pop directly (a tabs node) is given a
// `goBackTo` for the previous tab from the injected focus-order — keeping focus-order an orchestration
// concern, not a router parameter. If nothing handles it, the app exits.

import { getRouter } from './routerRegistry';
import { focusedChain } from './tree';
import type { GlobalNavState, NavNode } from './types';

export type BackResult = { key: string; next: NavNode } | { exit: true };

/** The key of the tab to refocus from focus-order (names, most-recent last), or undefined. */
function previousTabKey(node: NavNode, focusOrder?: string[]): string | undefined {
  if (!focusOrder || focusOrder.length < 2) return undefined;
  const current = node.routes[node.index]?.name;
  if (current === undefined) return undefined;
  const previous = focusOrder[focusOrder.indexOf(current) - 1];
  if (previous === undefined) return undefined;
  return node.routes.find((route) => route.name === previous)?.key;
}

export function resolveBack(state: GlobalNavState, focusOrder?: string[]): BackResult {
  const chain = focusedChain(state.root);
  for (let i = chain.length - 1; i >= 0; i--) {
    const node = chain[i]!;
    const router = getRouter(node.key);
    if (!router) continue;

    let next = router.getStateForAction(node, { type: 'goBack' });
    if (!next) {
      const prevKey = previousTabKey(node, focusOrder);
      if (prevKey) next = router.getStateForAction(node, { type: 'goBackTo', routeKey: prevKey });
    }
    if (next) return { key: node.key, next };
  }
  return { exit: true };
}
