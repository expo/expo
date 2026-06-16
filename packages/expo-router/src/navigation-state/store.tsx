// Phase 4 — root store + imperative bridge (RFC D12/D4, Decisions P-3/P-9).
//
// State lives in ONE root `useReducer`, distributed via context (NOT an external store) — this is
// what keeps transition updates deferrable (D4). The imperative `router` reaches the store through a
// thin module bridge: a `dispatch` ref plus a committed-state snapshot ref for reads outside render
// (`canGoBack`, current URL). Every dispatch is wrapped in `startTransition`.
//
// This is a minimal end-to-end proof. Documented for the integration session (Decisions P-9):
//   - install timing (insertion/layout effect) must precede children's effects — and must be wired
//     in lockstep with the synchronous `useLayoutEffect` seeding path (scenario 1b).
//   - the committed-snapshot contract is only truly satisfied with a pending-intent channel; the
//     effect-mirrored snapshot here lags by one commit under a concurrent root (P-3).
//   - transition policy should key off `source` (seed/hydration commit synchronously per C13/1b,
//     not via `startTransition`).
//   - StrictMode double-invoke survival, identity-guarded teardown, server no-op + `getServerSnapshot`,
//     context-fan-out selectors.
// There is no live consumer this session, so none of the above is built yet.

import { createContext, startTransition, use, useEffect, type ReactNode } from 'react';
import { useReducer } from 'react';

import { reduce, type NavAction } from './reducer';
import type { GlobalNavState } from './types';

let dispatchRef: ((action: NavAction) => void) | null = null;
let snapshotRef: GlobalNavState | null = null;

const StateContext = createContext<GlobalNavState | null>(null);

/** Read the navigation tree in render (React 19 `use`). */
export function useNavigationTree(): GlobalNavState {
  const state = use(StateContext);
  if (!state) throw new Error('useNavigationTree must be used within a NavigationStateProvider');
  return state;
}

export function NavigationStateProvider({
  initial,
  children,
}: {
  initial: GlobalNavState;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reduce, initial);

  // Client-only bridge install; torn down on unmount so a stale dispatch is never called.
  useEffect(() => {
    dispatchRef = dispatch;
    return () => {
      dispatchRef = null;
    };
  }, [dispatch]);

  // Mirror committed state for synchronous imperative reads (Decisions P-3 — committed, not in-flight).
  useEffect(() => {
    snapshotRef = state;
    return () => {
      snapshotRef = null;
    };
  }, [state]);

  return <StateContext value={state}>{children}</StateContext>;
}

/** Dispatch from outside render. Deferred via a transition so it stays cancellable (D4). */
export function dispatchNav(action: NavAction): void {
  const dispatch = dispatchRef;
  if (!dispatch) {
    throw new Error('Navigation store is not mounted — render a NavigationStateProvider first.');
  }
  startTransition(() => dispatch(action));
}

/** The last committed state, for reads outside render. Null before mount. */
export function getNavSnapshot(): GlobalNavState | null {
  return snapshotRef;
}
