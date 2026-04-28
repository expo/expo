import { useRef, useState } from 'react';

export type ObservableState<T> = { value: T };

/**
 * Web polyfill for the native `useNativeState` hook.
 */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  const [val, setVal] = useState<T>(initialValue);

  const valRef = useRef<T>(val);
  valRef.current = val;

  const stateRef = useRef<ObservableState<T> | null>(null);
  if (stateRef.current === null) {
    stateRef.current = {
      get value() {
        return valRef.current;
      },
      set value(v: T) {
        valRef.current = v;
        setVal(v);
      },
    };
  }
  return stateRef.current;
}
