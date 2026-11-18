import { useMemo, useRef, useState } from 'react';

import type { ObservableState } from './types';

export type { ObservableState };

/**
 * Web polyfill for the native `useNativeState` hook.
 */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  const [val, setVal] = useState<T>(initialValue);

  const valRef = useRef<T>(val);
  valRef.current = val;

  const accessorsRef = useRef<Pick<ObservableState<T>, 'get' | 'set'> | null>(null);
  if (accessorsRef.current === null) {
    accessorsRef.current = {
      get: () => valRef.current,
      set: (v: T) => {
        valRef.current = v;
        setVal(v);
      },
    };
  }
  const { get, set } = accessorsRef.current;

  // A new object for each value, so an element memoized on the state (for example, by the React
  // Compiler) renders the write.
  return useMemo(
    () => ({
      get value() {
        return get();
      },
      set value(v: T) {
        set(v);
      },
      get,
      set,
    }),
    [get, set, val]
  );
}
