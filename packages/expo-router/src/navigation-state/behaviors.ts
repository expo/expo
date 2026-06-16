// Phase 0 — the resolution seam (RFC C12-C, Decisions P-2/P-4).
//
// `resolve(intent, node, behavior)` turns a node-local intent into primitive ops the dumb reducer
// will apply. Behavior is a plain `switch` over two pure, stateless strategies — no registry (P-4).
// Resolution is render-free and decides ops purely from the node's current state, so it works for a
// branch that is absent / never mounted (the C12 thesis, Decisions P-5).

import type { BehaviorName, BehaviorStrategy, NavNode, NodeIntent, PrimitiveOp } from './types';

/** Keys of routes above the focused index — the part a stack pop discards. */
function routesAbove(node: NavNode, index: number): string[] {
  return node.routes.slice(index + 1).map((route) => route.key);
}

function pushOps(node: NavNode, route: NavNode['routes'][number]): PrimitiveOp[] {
  return [
    { type: 'insert', target: node.key, route },
    { type: 'setIndex', target: node.key, index: node.index + 1 },
  ];
}

const stackStrategy: BehaviorStrategy = {
  resolve(intent, node) {
    switch (intent.type) {
      case 'push':
        return pushOps(node, intent.route);
      case 'goBack': {
        const top = node.routes[node.index];
        if (node.index <= 0 || !top) return []; // cannot pop the anchor
        return [
          { type: 'remove', target: node.key, routeKeys: [top.key] },
          { type: 'setIndex', target: node.key, index: node.index - 1 },
        ];
      }
      case 'popTo': {
        const targetIndex = node.routes.findIndex((route) => route.key === intent.routeKey);
        if (targetIndex < 0) return []; // absent target → idempotent no-op (P-7)
        const removed = routesAbove(node, targetIndex);
        if (removed.length === 0) return [];
        return [
          { type: 'remove', target: node.key, routeKeys: removed },
          { type: 'setIndex', target: node.key, index: targetIndex },
        ];
      }
      case 'popToTop': {
        const removed = routesAbove(node, 0);
        if (removed.length === 0) return [];
        return [
          { type: 'remove', target: node.key, routeKeys: removed },
          { type: 'setIndex', target: node.key, index: 0 },
        ];
      }
      case 'focus': {
        // Navigate semantics: pop back to the route if it is already in history, else push it.
        const existing = node.routes.find((route) => route.name === intent.route.name);
        if (existing) {
          return stackStrategy.resolve({ type: 'popTo', routeKey: existing.key }, node);
        }
        return pushOps(node, intent.route);
      }
    }
  },
};

const tabsStrategy: BehaviorStrategy = {
  resolve(intent, node) {
    switch (intent.type) {
      case 'focus': {
        // Tabs never remove a route. Focus an existing tab → set-index; an absent one → promote it
        // (insert) then focus. The absent path is the unmounted-branch case (P-5).
        const existing = node.routes.findIndex((route) => route.name === intent.route.name);
        if (existing >= 0) {
          return [{ type: 'setIndex', target: node.key, index: existing }];
        }
        return [
          { type: 'insert', target: node.key, route: intent.route },
          { type: 'setIndex', target: node.key, index: node.routes.length },
        ];
      }
      // Refocusing the previous tab on back needs focus-order, supplied by the Phase 3 back resolver;
      // the per-node strategy alone yields nothing. Stack-only intents are not meaningful for tabs.
      case 'goBack':
      case 'push':
      case 'popTo':
      case 'popToTop':
        return [];
    }
  },
};

function behaviorFor(behavior: BehaviorName): BehaviorStrategy {
  switch (behavior) {
    case 'stack':
      return stackStrategy;
    case 'tabs':
      return tabsStrategy;
  }
}

/** The seam: resolve an intent against a node, given its behavior (Decisions P-4). */
export function resolve(intent: NodeIntent, node: NavNode, behavior: BehaviorName): PrimitiveOp[] {
  return behaviorFor(behavior).resolve(intent, node);
}
