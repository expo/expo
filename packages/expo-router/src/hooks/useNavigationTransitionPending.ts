'use client';
import { use } from 'react';

import { NavigationTransitionPendingContext } from '../global-state/transitionPendingContext';

/**
 * Returns `true` while a JS-initiated navigation is in flight — from the moment `router.push`
 * (or `navigate`/`replace`/`back`/…), a `Link` press, or a deep link dispatches, until its
 * destination is ready and committed. Because every JS-initiated navigation is a React transition,
 * a navigation whose destination suspends (a lazy bundle-split screen, a `use(promise)`/suspending
 * loader) keeps the current screen mounted while it prepares, and this hook is your signal to show a
 * global pending indicator during that window.
 *
 * Native-induced navigation (swipe-back, native tab press, hardware/header back) commits urgently and
 * does not set this pending state.
 *
 * Returns `false` when called outside a navigation container (for example, during server rendering).
 *
 * @example
 * ```tsx
 * import { useNavigationTransitionPending } from 'expo-router';
 *
 * function GlobalSpinner() {
 *   const pending = useNavigationTransitionPending();
 *   return pending ? <ActivityIndicator /> : null;
 * }
 * ```
 */
export function useNavigationTransitionPending(): boolean {
  return use(NavigationTransitionPendingContext).pending;
}
