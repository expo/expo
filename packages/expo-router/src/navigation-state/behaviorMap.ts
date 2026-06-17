// R-Phase C — the runtime producer of the `name → behavior` lookup the resolvers consume (seam #5,
// Decisions P-4/R-4). Navigators register their behavior at mount keyed by the name `focusedChain`
// uses (the owning route's name, or ROOT_NAME for the root). A plain module Map — no registry
// abstraction (P-4/P-12). Cleared between tests via `__resetBehaviorMapForTests`.

import type { BehaviorLookup, BehaviorName } from './types';

const map = new Map<string, BehaviorName>();

export function registerBehavior(name: string, behavior: BehaviorName): void {
  map.set(name, behavior);
}

/** A snapshot of the registrations, as the lookup the resolvers (resolveNavigate/resolveBack) read. */
export function getBehaviorLookup(): BehaviorLookup {
  return Object.fromEntries(map);
}

export function __resetBehaviorMapForTests(): void {
  map.clear();
}
