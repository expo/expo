import type { Href } from '../types';

// Route name to the `redirectTo` of the outermost failing guard. A missing name is accessible.
export type GuardedRedirects = ReadonlyMap<string, Href | undefined>;
export type Guard = { redirectTo: Href | undefined };

export function normalizeRouteName(routeName: string): string {
  return routeName.replace(/\/index$/, '');
}

export function getGuard(guards: GuardedRedirects, routeName: string): Guard | undefined {
  const name = guards.has(routeName) ? routeName : normalizeRouteName(routeName);
  return guards.has(name) ? { redirectTo: guards.get(name) } : undefined;
}
