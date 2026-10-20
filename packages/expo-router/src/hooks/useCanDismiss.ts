'use client';

import { use } from 'react';

import { CanDismissContext } from '../react-navigation/core/CanDismissContext';

/**
 * Returns whether a stack on the focused route can dismiss a screen.
 *
 * A new stack is detected after it mounts, so its first render can return `false`.
 *
 * @example
 * ```tsx
 * import { router, useCanDismiss } from 'expo-router';
 * import { Button } from 'react-native';
 *
 * export default function CloseButton() {
 *   const canDismiss = useCanDismiss();
 *   return <Button title="Close" disabled={!canDismiss} onPress={() => router.dismiss()} />;
 * }
 * ```
 */
export function useCanDismiss(): boolean {
  const canDismiss = use(CanDismissContext);
  if (canDismiss === undefined) {
    throw new Error('useCanDismiss was called from outside of Expo Router application.');
  }
  return canDismiss;
}
