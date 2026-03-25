import * as React from 'react';

/**
 * Use `useEffect` during SSR and `useLayoutEffect` in the Browser & React Native to avoid warnings.
 */
export const useClientLayoutEffect =
  typeof document !== 'undefined' ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
    ? React.useLayoutEffect
    : React.useEffect;
