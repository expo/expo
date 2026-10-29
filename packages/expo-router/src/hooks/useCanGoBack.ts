'use client';

import { use } from 'react';

import { CanGoBackContext } from '../react-navigation/core/CanGoBackContext';

/**
 * Returns the same value as `router.canGoBack()` and re-renders when it changes. With tabs or a
 * drawer, the value can change once after the first render.
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
  const canGoBack = use(CanGoBackContext);
  if (canGoBack === undefined) {
    throw new Error(
      '`useCanGoBack` was called from a component rendered outside the Expo Router root. Render the component inside `ExpoRoot`.'
    );
  }
  return canGoBack;
}
