import { useId, useMemo } from 'react';
import { scheduleOnUI } from 'react-native-worklets';

export type OnChangeSyncCallback<T> = (value: T) => void;

export type NativeStateRef<T> = {
  __nativeStateId: string;
  __initialValue: T;
  get: () => T;
  set: (value: T) => void;
  onChange: (callback: OnChangeSyncCallback<T>) => void;
};

export function useNativeState<T>(initialValue: T): NativeStateRef<T> {
  const id = useId();

  const ref = useMemo(
    () => ({
      __nativeStateId: id,
      __initialValue: initialValue,
      get: () => {
        'worklet';
        // @ts-ignore
        return global.ExpoNativeState?.get(id) ?? initialValue;
      },
      set: (value: T) => {
        'worklet';
        // @ts-ignore
        global.ExpoNativeState?.set(id, value);
      },
      onChange: (callback: OnChangeSyncCallback<T>) => {
        scheduleOnUI(() => {
          'worklet';
          // @ts-ignore
          if (global.ExpoNativeState?.[id]) {
            // @ts-ignore
            global.ExpoNativeState[id].onChange = callback;
          }
        });
      },
    }),
    [id]
  );

  return ref;
}
