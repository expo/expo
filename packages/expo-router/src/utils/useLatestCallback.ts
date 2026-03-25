import * as React from 'react';

/**
 * Use `useEffect` during SSR and `useInsertionEffect` in the Browser & React Native to avoid warnings.
 */
const useClientInsertionEffect =
  typeof document !== 'undefined' ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
    ? React.useInsertionEffect
    : React.useEffect;

/**
 * React hook which returns the latest callback without changing the reference.
 */
// TODO(@ubax): RN Migration - Consider replacing with useEffectEvent when it becomes stable
export default function useLatestCallback<T extends Function>(callback: T): T {
  const ref = React.useRef<T>(callback);

  const latestCallback = React.useRef(function latestCallback(this: unknown, ...args: unknown[]) {
    return ref.current.apply(this, args);
  } as unknown as T).current;

  useClientInsertionEffect(() => {
    ref.current = callback;
  }, [callback]);

  return latestCallback;
}
