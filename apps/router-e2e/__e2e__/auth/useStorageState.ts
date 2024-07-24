import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';

type UseStateHook<T> = [[boolean, T | null], (value?: T | null) => void];

function useAsyncState<T>(initialValue?: [boolean, T | null]): UseStateHook<T> {
  return React.useReducer(
    (state: [boolean, T | null], action?: T | null) => [
      false,
      action === undefined ? null : action,
    ],
    initialValue ?? [true, undefined]
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value == null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } else {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}

export function useStorageState(key: string): UseStateHook<string> {
  // Public
  const [state, setState] = useAsyncState<string>();

  // Get
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        setState(localStorage.getItem(key));
      }
    } else {
      SecureStore.getItemAsync(key).then((value) => {
        setState(value);
      });
    }
  }, [key]);

  // Set
  const setValue = React.useCallback(
    (value: string | null) => {
      setStorageItemAsync(key, value).then(() => {
        setState(value);
      });
    },
    [key]
  );

  return [state, setValue];
}
