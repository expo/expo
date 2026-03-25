'use client';
import { use } from 'react';

import { LocaleDirContext } from './LocaleDirContext';

/**
 * Hook to access the text direction specified in the `NavigationContainer`.
 */
export function useLocale() {
  const direction = use(LocaleDirContext);

  if (direction === undefined) {
    throw new Error(
      "Couldn't determine the text direction. Is your component inside NavigationContainer?"
    );
  }

  return { direction };
}
