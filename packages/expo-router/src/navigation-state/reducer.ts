// Phase 1 — the dumb, pure, synchronous reducer (RFC D5/D12, Decisions P-3).
//
// It applies primitive ops to the homogeneous tree and nothing more: no intent semantics (that is
// the resolution seam, behaviors.ts), no animation, no provenance handling. Purity is the source of
// D4's "additive / never lost" guarantee — every op derives only from `prevState`.

import type { ActionSource, GlobalNavState, NavNode, PrimitiveOp, RouteEntry } from './types';

/** A committed update: the ops to apply plus where it came from. The reducer ignores `source`; it
 * rides along for the render layer (Decisions P-6). */
export type NavAction = { ops: PrimitiveOp[]; source: ActionSource };

/** Keep `index` within `[0, length)` — a structural invariant of a node, not a navigation decision.
 * The resolution layer owns *which* route is focused; this only prevents an out-of-bounds index. */
const clampIndex = (index: number, length: number): number =>
  Math.max(0, Math.min(index, Math.max(0, length - 1)));

function applyToNode(node: NavNode, op: PrimitiveOp): NavNode {
  switch (op.type) {
    case 'insert': {
      if (node.routes.some((route) => route.key === op.route.key)) {
        return node; // dedupe by key — a native echo of a JS push is a no-op (P-7)
      }
      return { ...node, routes: [...node.routes, op.route] };
    }
    case 'remove': {
      const drop = new Set(op.routeKeys);
      const routes = node.routes.filter((route) => !drop.has(route.key));
      if (routes.length === node.routes.length) return node; // absent target → identity (P-7)
      return { ...node, routes, index: clampIndex(node.index, routes.length) };
    }
    case 'setIndex': {
      const index = clampIndex(op.index, node.routes.length);
      return index === node.index ? node : { ...node, index }; // identity when unchanged → bail-out
    }
  }
}

/** Replace the node whose key matches `target`, rebuilding the immutable spine above it. Keys are
 * unique across the tree (see `NavNode.key`), so the first match is the only match — stop there. */
function updateNode(node: NavNode, op: PrimitiveOp): NavNode {
  if (node.key === op.target) {
    return applyToNode(node, op);
  }
  let found = false;
  const routes: RouteEntry[] = node.routes.map((route) => {
    if (found || !route.child) return route;
    const child = updateNode(route.child, op);
    if (child === route.child) return route;
    found = true;
    return { ...route, child };
  });
  return found ? { ...node, routes } : node;
}

export function reduce(state: GlobalNavState, action: NavAction): GlobalNavState {
  const root = action.ops.reduce(updateNode, state.root);
  return root === state.root ? state : { root };
}
