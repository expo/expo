import type { FailedGuard } from '../layouts/GuardContext';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import type { NavigationAction } from '../react-navigation/routers';
import type { Href } from '../types';
import { getRouteInfoFromState, type StrictState } from './getRouteInfoFromState';
import type { TreeNode } from './reduceNavigationTree';
import type { RouterRegistry } from './routerRegistry';

export class ProtectedRedirectLoopError extends Error {
  constructor(href: string) {
    super(
      `Protected route redirects form a loop at "${href}": each \`redirectTo\` leads to another blocked route. Set \`redirectTo\` to a route that is accessible.`
    );
  }
}

const routeActionTypes = new Set(['NAVIGATE', 'PUSH', 'REPLACE', 'PRELOAD', 'JUMP_TO']);

type ActionGuard = FailedGuard & { href?: string };

/**
 * Returns the failed guard for a direct navigator action, such as `navigation.push('login')`.
 * The navigator that would handle the action decides: the target, or the first navigator from the
 * origin upward that declares the route name.
 */
export function findActionGuard(
  action: NavigationAction,
  origin: TreeNode,
  nodes: ReadonlyMap<string, TreeNode>,
  registry: RouterRegistry
): ActionGuard | undefined {
  const payload: { name?: unknown; params?: object } | undefined = action.payload;
  const name = payload?.name;
  if (!routeActionTypes.has(action.type) || typeof name !== 'string') {
    return undefined;
  }
  const start = typeof action.target === 'string' ? nodes.get(action.target) : origin;
  for (let node = start; node; node = node.parent) {
    const guard = registry.get(node.state.key)?.guardForRoute?.(name);
    if (guard) {
      return guard.redirectTo === undefined
        ? guard
        : { ...guard, href: getRedirectHref(guard.redirectTo, name, node, payload?.params) };
    }
    if (node.state.routeNames.includes(name) || action.target === node.state.key) {
      return undefined;
    }
  }
  return undefined;
}

// A relative redirect resolves from the guarded destination, as it does for an href request.
// Route info reads only the focused path, so each level keeps only its focused route.
function getRedirectHref(redirectTo: Href, name: string, node: TreeNode, params?: object) {
  let state: StrictState = { routes: [{ name, params }] };
  for (let child = node; child.parent; child = child.parent) {
    const { name, params } = child.parent.state.routes[child.parentRouteIndex!]!;
    state = { routes: [{ name, params, state }] };
  }
  return resolveHrefStringWithSegments(resolveHref(redirectTo), getRouteInfoFromState(state));
}
