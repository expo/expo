'use client';

import { DependencyList } from 'react';
import { createSerializable, type SerializableRef } from 'react-native-worklets';

import { useReleasingSharedObject } from './useReleasingSharedObject';

const createWorkletCallback: ((fn: SerializableRef<(...args: any[]) => any>) => any) | undefined =
  globalThis?.expo?.createWorkletCallback;

/**
 * Wraps a worklet function in a `WorkletCallback` SharedObject and returns its numeric ID,
 * which can be passed as a prop through React Native's serialization.
 */
export function useWorkletCallback(
  workletFn: ((...args: any[]) => any) | undefined,
  deps: DependencyList
): number | undefined {
  const callback = useReleasingSharedObject(
    () =>
      createWorkletCallback && workletFn
        ? createWorkletCallback(createSerializable(workletFn))
        : null,
    deps
  );

  return callback?.__expo_shared_object_id__ as number | undefined;
}
