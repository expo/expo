// Root store + imperative bridge (RFC D12/D4, Decisions P-3/P-9).
//
// State lives in ONE root `useReducer`, distributed via context (NOT an external store) — this is
// what keeps transition updates deferrable (D4). The imperative `router` reaches the store through a
// thin module bridge: a `dispatch` ref plus a committed-state snapshot ref for reads outside render.
// Every dispatch is wrapped in `startTransition`.
//
// Still deferred (Decisions P-9): install timing vs synchronous seeding (1b); a pending-intent channel
// for the committed-snapshot contract under a concurrent root; transition policy keyed off `source`;
// StrictMode double-invoke survival; server `getServerSnapshot`; context-fan-out selectors.

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

/** Like `useNavigationTree` but returns null outside a provider — so it can be called
 * unconditionally (e.g. by `useRouteInfo`, which runs whether or not the flag is on). */
export function useOptionalNavigationTree(): GlobalNavState | null {
  return use(StateContext);
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
