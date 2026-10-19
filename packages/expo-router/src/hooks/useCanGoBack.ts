'use client';

import type { NavigationState, PartialState } from '../react-navigation/routers';
import { useRootNavigationState } from './useRootNavigationState';

/**
 * Returns whether a navigator on the focused route can go back. Reads React's
 * navigation state during render and updates when navigation changes.
 *
 * On the first render, a tab or drawer's back policy and screen order may not yet
 * be reflected in root state. The navigator reconciles its history after mounting,
 * which re-renders consumers with the corrected value.
 *
 * Combining `unstable_settings.anchor` with `backBehavior="none"` intentionally
 * disables tab back navigation. Before tab history is initialized, this hook can
 * report the anchored route as a back target instead.
 *
 * @example
 * ```tsx
 * import { router, useCanGoBack } from 'expo-router';
 * import { Button } from 'react-native';
 *
 * export default function BackButton() {
 *   const canGoBack = useCanGoBack();
 *   return <Button title="Back" disabled={!canGoBack} onPress={() => router.back()} />;
 * }
 * ```
 */
export function useCanGoBack(): boolean {
  let state: NavigationState | PartialState<NavigationState> | undefined = useRootNavigationState();
  while (state) {
    if (state.history != null ? state.history.length > 1 : (state.index ?? 0) > 0) {
      return true;
    }
    state = state.routes[state.index ?? 0]?.state;
  }
  return false;
}
