import { useRef, useState } from 'react';

import type { ObservableState } from './types';

export type { ObservableState };

/**
 * Web polyfill for the native `useNativeState` hook.
 */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  const [val, setVal] = useState<T>(initialValue);

  const valRef = useRef<T>(val);
  valRef.current = val;

  const stateRef = useRef<ObservableState<T> | null>(null);
  if (stateRef.current === null) {
    const get = () => valRef.current;
    const set = (v: T) => {
      valRef.current = v;
      setVal(v);
    };
    stateRef.current = {
      get value() {
        return get();
      },
      set value(v: T) {
        set(v);
      },
      get,
      set,
    };
  }
  return stateRef.current;
}
