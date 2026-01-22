import { useId, useMemo } from 'react';
import { scheduleOnUI } from 'react-native-worklets';

export type OnChangeSyncCallback = (text: string) => void;

export type NativeStateRef = {
  __nativeStateId: string;
  __initialValue: string;
  get: () => string;
  set: (value: string) => void;
  onChange: (callback: OnChangeSyncCallback) => void;
};

export function useNativeState(initialValue: string): NativeStateRef {
  const id = useId();

  const ref = useMemo(
    () => ({
      __nativeStateId: id,
      __initialValue: initialValue,
      get: () => {
        'worklet';
        // @ts-ignore
        return global.ExpoNativeState?.get(id) ?? '';
      },
      set: (value: string) => {
        'worklet';
        // @ts-ignore
        global.ExpoNativeState?.set(id, value);
      },
      onChange: (callback: OnChangeSyncCallback) => {
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
