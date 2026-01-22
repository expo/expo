import { useId, useMemo, useEffect } from 'react';
import { scheduleOnUI } from 'react-native-worklets';

export type OnChangeSyncCallback = (text: string) => void;

export type NativeStateRef = {
  __nativeStateId: string;
  __initialValue: string;
  get: () => string;
  set: (value: string) => void;
  registerOnChange: (callback: OnChangeSyncCallback) => void;
};

export function useNativeState(initialValue: string): NativeStateRef {
  const id = useId();

  useEffect(() => {
    return () => {
      scheduleOnUI(() => {
        'worklet';
        // @ts-ignore
        if (global.ExpoNativeStateCallbacks) {
          // @ts-ignore
          delete global.ExpoNativeStateCallbacks[id];
        }
      });
    };
  }, [id]);

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
      registerOnChange: (callback: OnChangeSyncCallback) => {
        scheduleOnUI(() => {
          'worklet';
          // @ts-ignore
          if (!global.ExpoNativeStateCallbacks) {
            // @ts-ignore
            global.ExpoNativeStateCallbacks = {};
          }
          // @ts-ignore
          global.ExpoNativeStateCallbacks[id] = callback;
        });
      },
    }),
    [id]
  );

  return ref;
}

declare global {
  var ExpoNativeState: {
    create: (stateId: string, initialValue: string) => void;
    get: (stateId: string) => string;
    set: (stateId: string, value: string) => void;
    delete: (stateId: string) => void;
  } | undefined;
}
