// Phase 3a — render-free back-bubbling resolution (RFC scenario 5/6, C12, Decisions P-8).
//
// Back bubbles from the focused leaf upward; the first node that produces ops handles it, else the
// app exits. Tabs refocus uses the injected focus-order (the per-node strategy has none).

import { resolve } from './behaviors';
import { focusedChain } from './tree';
import type { BehaviorLookup, GlobalNavState, NavNode, PrimitiveOp } from './types';

export type BackResult = { ops: PrimitiveOp[] } | { exit: true };

/** Set-index ops to refocus the previous tab named by focus-order, or undefined if there is none. */
function tabsBackOps(node: NavNode, focusOrder?: string[]): PrimitiveOp[] | undefined {
  if (!focusOrder || focusOrder.length < 2) return undefined;
  const current = node.routes[node.index]?.name;
  if (current === undefined) return undefined;
  const previous = focusOrder[focusOrder.indexOf(current) - 1];
  if (previous === undefined) return undefined; // current is first (or absent) → nothing before it
  const targetIndex = node.routes.findIndex((route) => route.name === previous);
  return targetIndex < 0 ? undefined : [{ type: 'setIndex', target: node.key, index: targetIndex }];
}

export function resolveBack(
  state: GlobalNavState,
  lookup: BehaviorLookup,
  focusOrder?: string[]
): BackResult {
  const chain = focusedChain(state.root);
  for (let i = chain.length - 1; i >= 0; i--) {
    const { node, name } = chain[i]!;
    // A node handles back only if it produces ops; empty ops keep bubbling, so a handler can never
    // silently swallow the press (the Android BackHandler then returns false → app exit).
    let ops: PrimitiveOp[] | undefined;
    switch (lookup[name]) {
      case 'stack':
        ops = resolve({ type: 'goBack' }, node, 'stack');
        break;
      case 'tabs':
        ops = tabsBackOps(node, focusOrder);
        break;
      // unknown behavior (custom navigator): bubble past it
    }
    if (ops?.length) return { ops };
  }
  return { exit: true };
}
