import type { NavigationStateLike } from './types';

/**
 * Builds a pathname from the focused route-name chain, e.g. `/Group/Details`.
 * This mirrors how the expo-router integration derives its route pattern from
 * `useSegments()` ('/' + segments joined with '/'), so both integrations tag
 * metrics with the same stable, params-free shape. Route params are
 * intentionally not serialized into the path — they are reported separately
 * as `routeParams`.
 */
export function getPathname(state: NavigationStateLike | undefined): string | undefined {
  if (!state) return undefined;
  const segments: string[] = [];
  let current: NavigationStateLike | undefined = state;
  while (current) {
    const route = current.routes[current.index ?? 0];
    if (!route) break;
    segments.push(route.name);
    current = route.state as NavigationStateLike | undefined;
  }
  if (segments.length === 0) return undefined;
  return '/' + segments.join('/');
}
