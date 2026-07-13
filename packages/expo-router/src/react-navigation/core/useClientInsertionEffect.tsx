'use client';
import * as React from 'react';

/**
 * Use `useEffect` during SSR and `useInsertionEffect` in the Browser & React Native to avoid warnings.
 */
export const useClientInsertionEffect =
  typeof document !== 'undefined' ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
    ? (React.useInsertionEffect ?? React.useLayoutEffect)
    : React.useEffect;
