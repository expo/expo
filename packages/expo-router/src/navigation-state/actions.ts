// Forward navigation resolution (RFC scenario 3/4, Decisions R-13).
//
// `navigate(path)` = hydrate the target path, then walk current vs target in lockstep: at each level
// run that node's registered router with a `navigate` action (focus an existing route, or promote an
// absent one — grafting the hydrated child subtree). Compose the per-level results into a new root.
// An absent branch is grafted from the hydrated payload by the nearest mounted ancestor, so the
// unmounted child's own router is never needed (the C12 hybrid, Decisions R-13).

import { getRouter } from './routerRegistry';
import type { GlobalNavState, NavNode } from './types';

function walk(cur: NavNode, target: NavNode): NavNode | null {
  const targetRoute = target.routes[target.index];
  if (!targetRoute) return null;
  const router = getRouter(cur.key);
  if (!router) return null; // unmounted ancestor — not resolvable render-free (documented C12 limit)

  const existing = cur.routes.find((route) => route.name === targetRoute.name);
  const navigated = router.getStateForAction(cur, {
    type: 'navigate',
    // Promote (absent) → graft the hydrated child; focus (existing) → router keeps the child, we recurse.
    target: {
      key: targetRoute.key,
      name: targetRoute.name,
      params: targetRoute.params,
      child: existing ? undefined : targetRoute.child,
    },
  });
  let node = navigated ?? cur;

  // For an existing route, apply the deeper navigation to its child: recurse if the child navigator
  // already exists, else graft the hydrated child subtree (the route had no nested navigator yet).
  if (existing && targetRoute.child) {
    const focused = node.routes[node.index];
    if (focused) {
      const childNext = focused.child ? walk(focused.child, targetRoute.child) : targetRoute.child;
      if (childNext && childNext !== focused.child) {
        const routes = [...node.routes];
        routes[node.index] = { ...focused, child: childNext };
        node = { ...node, routes };
      }
    }
  }

  return node === cur ? null : node;
}

/** The new root after navigating `current` toward a hydrated `target`, or null if nothing changes. */
export function resolveNavigate(current: GlobalNavState, target: GlobalNavState): NavNode | null {
  return walk(current.root, target.root);
}
