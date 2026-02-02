'use client';

import { DependencyList, useEffect, useMemo, useRef } from 'react';
import { createSerializable, type SerializableRef } from 'react-native-worklets';

const createWorkletCallback: ((fn: SerializableRef<(...args: any[]) => void>) => any) | undefined =
  globalThis?.expo?.createWorkletCallback;

/**
 * Wraps a worklet function in a `WorkletCallback` SharedObject and returns its numeric ID,
 * which can be passed as a prop through React Native's serialization.
 *
 * Follows the same lifecycle pattern as `useReleasingSharedObject` for proper cleanup
 * on unmount and fast refresh.
 */
export function useWorkletCallback(
  workletFn: ((...args: any[]) => void) | undefined,
  deps: DependencyList
): number | undefined {
  if (!createWorkletCallback || !workletFn) {
    return undefined;
  }

  const callbackRef = useRef<any>(null);
  const callbackToRelease = useRef<any>(null);
  const isFastRefresh = useRef(false);
  const previousDeps = useRef<DependencyList>(deps);

  if (callbackRef.current == null) {
    callbackRef.current = createWorkletCallback(createSerializable(workletFn));
  }

  const id = useMemo(() => {
    const depsEqual =
      previousDeps.current?.length === deps.length &&
      deps.every((v, i) => v === previousDeps.current[i]);

    if (!callbackRef.current || !depsEqual) {
      callbackToRelease.current = callbackRef.current;
      callbackRef.current = createWorkletCallback!(createSerializable(workletFn!));
      previousDeps.current = deps;
    }
    return callbackRef.current.__expo_shared_object_id__ as number;
  }, deps);

  useEffect(() => {
    if (callbackToRelease.current) {
      callbackToRelease.current.release();
      callbackToRelease.current = null;
    }
  }, [id]);

  useMemo(() => {
    isFastRefresh.current = true;
  }, []);

  useEffect(() => {
    isFastRefresh.current = false;
    return () => {
      if (!isFastRefresh.current && callbackRef.current) {
        callbackRef.current.release();
      }
    };
  }, []);

  return id;
}
