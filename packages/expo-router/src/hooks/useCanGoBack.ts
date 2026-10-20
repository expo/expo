'use client';

import { use } from 'react';

import { CanGoBackContext } from '../react-navigation/core/CanGoBackContext';

/**
 * Returns whether a navigator on the focused route can go back.
 *
 * On the first render, a tab or drawer's back policy may not yet be reflected in
 * root state. The navigator reconciles its history after mounting, which
 * re-renders consumers with the corrected value.
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
    throw new Error('useCanGoBack was called from outside of Expo Router application.');
  }
  return canGoBack;
}
