// Phase 3a — forward navigation resolution (RFC scenario 3/4, Decisions P-2/P-5).
//
// `navigate(path)` is modelled as: hydrate the target path into a minimal tree, then diff it against
// current state along the target's focused path, emitting ops via the resolution seam. Matching is by
// route name; a route already present is focused (stack pop-to / tabs set-index), an absent one is
// promoted (its hydrated subtree carries the deep path), so a cross-tab deep link is one batch.
//
// Known limits, deferred to Phase 3/D7 (no consumer yet): the target is absolute (hydrated from
// root), so relative/navigator scopes must resolve to an absolute path upstream; and routes are
// matched by NAME only, so navigating to a same-named route with different params focuses the
// existing one without updating params — that needs the deferred `replace` primitive (Decisions P-12).

import { resolve } from './behaviors';
import { ROOT_NAME } from './tree';
import type { BehaviorLookup, GlobalNavState, NavNode, PrimitiveOp } from './types';

function walk(
  cur: NavNode,
  tgt: NavNode,
  name: string,
  lookup: BehaviorLookup,
  ops: PrimitiveOp[]
): void {
  const behavior = lookup[name];
  const tgtRoute = tgt.routes[tgt.index];
  if (!tgtRoute || !behavior) return;

  const existing = cur.routes.find((route) => route.name === tgtRoute.name);
  if (!existing) {
    // Absent → promote/push the target route; its hydrated subtree carries any deeper path.
    ops.push(...resolve({ type: 'focus', route: tgtRoute }, cur, behavior));
    return;
  }
  // Present → focus it, then continue diffing into the shared child navigator.
  ops.push(...resolve({ type: 'focus', route: existing }, cur, behavior));
  if (tgtRoute.child && existing.child) {
    walk(existing.child, tgtRoute.child, tgtRoute.name, lookup, ops);
  }
}

/** Ops to navigate current state toward a hydrated target (RFC scenario 3/4). */
export function resolveNavigate(
  current: GlobalNavState,
  target: GlobalNavState,
  lookup: BehaviorLookup
): PrimitiveOp[] {
  const ops: PrimitiveOp[] = [];
  walk(current.root, target.root, ROOT_NAME, lookup, ops);
  return ops;
}
