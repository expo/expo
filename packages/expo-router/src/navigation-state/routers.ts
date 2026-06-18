// Per-navigator routers (Decisions R-13). A router's single `getStateForAction(node, action)` returns
// the next LOCAL subtree (this node + its children) for an RFC action, or `null` if it doesn't change
// / doesn't handle it (so back can bubble and the reducer can bail). Pure and render-free — mirrors
// react-navigation's `Router.getStateForAction`, but over our homogeneous `NavNode`.

import { createRouteKey } from './keys';
import type { NavRouter, RouteEntry, TargetRoute } from './types';

/** Build a route entry for a promoted/pushed/replaced route. Reuses the hydrated key when present. */
function makeRoute(target: TargetRoute): RouteEntry {
  const entry: RouteEntry = { key: target.key ?? createRouteKey(target.name), name: target.name };
  if (target.params) entry.params = target.params;
  if (target.child) entry.child = target.child;
  return entry;
}

export const stackRouter: NavRouter = {
  getStateForAction(node, action) {
    switch (action.type) {
      case 'navigate': {
        const existing = node.routes.findIndex((route) => route.name === action.target.name);
        if (existing >= 0) {
          // Navigate semantics: pop back to the existing route (truncate everything above it).
          if (existing === node.index && existing === node.routes.length - 1) return null;
          return { ...node, routes: node.routes.slice(0, existing + 1), index: existing };
        }
        const routes = [...node.routes, makeRoute(action.target)];
        return { ...node, routes, index: routes.length - 1 };
      }
      case 'goBack': {
        if (node.index <= 0) return null; // can't pop the anchor → bubble
        return { ...node, routes: node.routes.slice(0, node.index), index: node.index - 1 };
      }
      case 'goBackTo': {
        const i = node.routes.findIndex((route) => route.key === action.routeKey);
        if (i < 0 || i >= node.index) return null; // absent or not below the focused route
        return { ...node, routes: node.routes.slice(0, i + 1), index: i };
      }
      case 'replace': {
        const routes = [...node.routes];
        routes[node.index] = makeRoute(action.target);
        return { ...node, routes };
      }
      case 'reset':
        return action.state;
      case 'preload':
        return null; // navigator-local (D6) — never global state
    }
  },
};

export const tabsRouter: NavRouter = {
  getStateForAction(node, action) {
    switch (action.type) {
      case 'navigate': {
        const existing = node.routes.findIndex((route) => route.name === action.target.name);
        if (existing >= 0) {
          // Tabs never remove a route: switching is a set-index.
          return existing === node.index ? null : { ...node, index: existing };
        }
        const routes = [...node.routes, makeRoute(action.target)]; // promote the tab
        return { ...node, routes, index: routes.length - 1 };
      }
      case 'goBackTo': {
        const i = node.routes.findIndex((route) => route.key === action.routeKey);
        return i < 0 || i === node.index ? null : { ...node, index: i };
      }
      case 'replace': {
        const routes = [...node.routes];
        routes[node.index] = makeRoute(action.target);
        return { ...node, routes };
      }
      case 'reset':
        return action.state;
      // Tabs back is handled by the cross-tree resolver (focus-order → goBackTo); the router alone bubbles.
      case 'goBack':
      case 'preload':
        return null;
    }
  },
};
