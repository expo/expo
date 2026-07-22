import isEqual from 'fast-deep-equal';

import type { NavigationState, PartialState } from '../react-navigation/routers';

type AnyState = NavigationState | PartialState<NavigationState>;

// A key minted by a router when it had no stable key to assign: `${route.name}-${nanoid()}`, where
// `nanoid/non-secure` emits 21 chars of the URL-safe alphabet. Structural keys (`@:name:index`)
// never match this shape (they contain `:`), so normalizing only the minted shape can't mask a
// structural-key difference. See `BaseRouter` (keyless RESET) and `StackRouter` (empty reconcile).
const MINTED_KEY = /^(.+)-[A-Za-z0-9_-]{21}$/;

// Two route keys are equivalent for the shadow compare if they're identical, or if both are minted
// keys for the same route name — the two reductions each mint a fresh nanoid, so their keys differ
// even though the trees are behaviorally identical.
function keysEquivalent(a: string | undefined, b: string | undefined): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  const ma = MINTED_KEY.exec(a);
  const mb = MINTED_KEY.exec(b);
  return ma != null && mb != null && ma[1] === mb[1];
}

// Deep-equal two committed navigation trees, tolerating the one legitimate divergence between the
// eager reduction and the shadow `useReducer`: freshly minted nanoid route keys. Everything else
// (names, index, params, structure, structural keys) must match exactly, so a real behavioral
// divergence still fails.
export function shadowTreesMatch(a: AnyState | undefined, b: AnyState | undefined): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }

  if (a.index !== b.index || a.key !== b.key) {
    return false;
  }
  if (a.routes.length !== b.routes.length) {
    return false;
  }

  for (let i = 0; i < a.routes.length; i++) {
    const ra = a.routes[i]!;
    const rb = b.routes[i]!;

    if (ra.name !== rb.name) {
      return false;
    }
    if (!keysEquivalent(ra.key, rb.key)) {
      return false;
    }
    if (!isEqual(ra.params, rb.params)) {
      return false;
    }
    if (!shadowTreesMatch(ra.state, rb.state)) {
      return false;
    }
  }

  return true;
}
