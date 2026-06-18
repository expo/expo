// The render-time router registry (Decisions R-13). Each navigator registers its router at mount,
// keyed by its NavNode key (unique tree-wide). The render-free imperative/back resolvers look a
// node's router up here to run `getStateForAction` without the navigator being the one in scope.
// Keyed by node key (not route name) — fixes the name-uniqueness caveat of the old behavior map.

import type { NavRouter } from './types';

const registry = new Map<string, NavRouter>();

export function registerRouter(key: string, router: NavRouter): void {
  registry.set(key, router);
}

/** Drop a navigator's router on unmount so the registry doesn't grow unbounded as new branches mount. */
export function unregisterRouter(key: string): void {
  registry.delete(key);
}

export function getRouter(key: string): NavRouter | undefined {
  return registry.get(key);
}

export function __resetRouterRegistryForTests(): void {
  registry.clear();
}
