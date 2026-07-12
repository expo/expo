'use client';

import { INTERNAL_SLOT_NAME } from '../constants';
import type { NavigationProp, NavigationState } from '../react-navigation/native';
import { useNavigation } from '../react-navigation/native';

/**
 * Returns the navigation state of the root navigator — the top-level navigator that
 * contains the current screen.
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
 *
 * @see The [navigation state](/router/reference/navigation-state/) reference for the
 * shape of the returned object.
 */
export function useRootNavigationState(): NavigationState {
  const parent =
    // We assume that this is called from routes in __root
    // Users cannot customize the generated Sitemap or NotFound routes, so we should be safe
    useNavigation<NavigationProp<object, never, string>>().getParent(INTERNAL_SLOT_NAME);
  if (!parent) {
    throw new Error(
      'useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.'
    );
  }
  return parent.getState();
}
