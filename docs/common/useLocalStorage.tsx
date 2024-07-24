import { useState, useEffect } from 'react';

import { isLocalStorageAvailable } from './sentry-utilities';

type Args<T> = {
  name: string;
  defaultValue: T;
};

export function useLocalStorage<T>(args: Args<T>): [T, (arg: T) => void, () => void] {
  const { defaultValue, name } = args;
  const [value, setValue] = useState<T | undefined>(undefined);
  const persistenceKey = `@expo-docs/useLocalStorage/${name}`;

  useEffect(function didMount() {
    if (isLocalStorageAvailable()) {
      const persistedState = localStorage.getItem(persistenceKey);
      if (persistedState) {
        setValue(JSON.parse(persistedState));
      } else {
        setValue(defaultValue);
      }
    }
  }, []);

  useEffect(
    function persistOnChange() {
      if (isLocalStorageAvailable() && value !== undefined)
        localStorage.setItem(persistenceKey, JSON.stringify(value));
    },
    [value]
  );

  function removeValue() {
    if (isLocalStorageAvailable()) localStorage.removeItem(persistenceKey);
  }

  return [value ?? defaultValue, setValue, removeValue];
}
