import { useId, useMemo } from 'react';

export type NativeStateRef = {
  __nativeStateId: string;
  __initialValue: string;
  get: () => string;
  set: (value: string) => void;
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
