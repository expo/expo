import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';

type NullableValue<T> = T | null;
type State<T> = [boolean, NullableValue<T>];
type SetValue<T> = (value: NullableValue<T>) => void;
type UseStateHook<T> = [State<T>, SetValue<T>];

function reducer<T>(state: State<T>, action?: NullableValue<T>): State<T> {
  return [false, action === undefined ? null : action];
}

function useAsyncState<T>(
  initialValue: State<T> = [true, null],
): UseStateHook<T> {
  return React.useReducer(reducer<T>, initialValue);
}

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
       if (value === null) {
         localStorage.removeItem(key);
       } else {
         localStorage.setItem(key, value);
       }
     } catch (e) {
       console.error('Local storage is unavailable:', e);
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
      try {
        if (typeof localStorage !== 'undefined') {
          setState(localStorage.getItem(key));
        }
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      SecureStore.getItemAsync(key).then(value => {
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