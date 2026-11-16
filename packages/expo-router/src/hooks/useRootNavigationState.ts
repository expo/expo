'use client';

import { use } from 'react';

import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import type { NavigationState } from '../react-navigation/native';

/**
 * Returns the navigation state of the root navigator — the top-level navigator that
 * contains the current screen. Its shape follows the `NavigationState` type of the
 * installed `expo-router` version.
 *
 * @example
 * ```tsx
 * import { useRootNavigationState } from 'expo-router';
 *
 * export default function Route() {
 *  const { routes } = useRootNavigationState();
 *
 *  return <Text>{routes[0].name}</Text>;
 * }
 * ```
 *
 * @returns The current `NavigationState` of the root navigator.
 */
export function useRootNavigationState(): NavigationState {
  const state = use(RootNavigationStateContext);
  if (state === undefined) {
    throw new Error(
      'useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.'
    );
  }
  return state;
}
