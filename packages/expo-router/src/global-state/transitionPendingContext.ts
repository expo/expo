'use client';
import { createContext } from 'react';

// Navigation pending signal (D3), published by the container from committed values. `lastIssued` is
// bumped urgently per JS-initiated dispatch; `lastReduced` is recorded by the reducer on every path.
//  - Global `useNavigationTransitionPending` reads `pending` (`lastIssued > lastReduced`).
//  - Per-Link `useLinkStatus` reads `lastReduced` and compares it to the id its own press minted
//    (captured via `getLastIssued()` synchronously after dispatch), so a Link's status tracks only
//    its own navigation — without a per-Link `useTransition` (which the container's own
//    `React.startTransition` re-wrap would defeat; Step 8 / PLAN D3 correction).
// Defaults are the resting values (also the RSC / no-container case): nothing issued, nothing pending.
export type NavigationTransitionPending = {
  pending: boolean;
  lastReduced: number;
  // Synchronous read of the container's monotonic issued counter — a Link press calls this right
  // after dispatching to learn the id its own navigation minted. Stable identity across renders.
  getLastIssued: () => number;
};

export const NavigationTransitionPendingContext = createContext<NavigationTransitionPending>({
  pending: false,
  lastReduced: 0,
  getLastIssued: () => 0,
});
