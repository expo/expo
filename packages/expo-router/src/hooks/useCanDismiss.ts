'use client';

import { use } from 'react';

import { CanDismissContext } from '../react-navigation/core/CanDismissContext';

/**
 * Returns the same value as `router.canDismiss()` and re-renders when it changes. Unlike
 * `router.canDismiss()`, it is correct during render.
 *
 * @example
 * ```tsx
 * import { router, useCanDismiss } from 'expo-router';
 * import { Button } from 'react-native';
 *
 * export default function CloseButton() {
 *   const canDismiss = useCanDismiss();
 *   return canDismiss ? <Button title="Close" onPress={() => router.dismiss()} /> : null;
 * }
 * ```
 */
export function useCanDismiss(): boolean {
  const canDismiss = use(CanDismissContext);
  if (canDismiss === undefined) {
    throw new Error(
      '`useCanDismiss` was called from a component rendered outside the Expo Router root. Render the component inside `ExpoRoot`.'
    );
  }
  return canDismiss;
}
