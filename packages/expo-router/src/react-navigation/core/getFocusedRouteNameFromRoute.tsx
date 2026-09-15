import type { Route } from '../routers';
import { CHILD_STATE } from './useRouteCache';

export function getFocusedRouteNameFromRoute(route: Partial<Route<string>>): string | undefined {
  // @ts-expect-error: this isn't in type definitions coz we want this private
  const state = route[CHILD_STATE] ?? route.state;
  // TODO(@ubax): https://github.com/expo/expo/pull/48757 - remove the stack.type check from here
  const routeName = state
    ? // Get the currently active route name in the nested navigator
      state.routes[
        // If we have a partial state without index, for tab/drawer, first screen will be focused one, and last for stack
        // Deep-link partial states can omit both index and type; typeless full states still have an index
        state.index ??
          (typeof state.type === 'string' && state.type !== 'stack' ? 0 : state.routes.length - 1)
      ].name
    : undefined;

  return routeName;
}
