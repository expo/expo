'use client';

import { DependencyList, useRef, useMemo, useEffect } from 'react';

import type { SharedObject } from '../ts-declarations/SharedObject';

/**
 * Returns a shared object, which is automatically cleaned up when the component is unmounted.
 */
export function useReleasingSharedObject<TSharedObject extends SharedObject>(
  factory: () => TSharedObject,
  dependencies: DependencyList
): TSharedObject {
  const objectRef = useRef<TSharedObject | null>(null);
  const isFastRefresh = useRef(false);
  const previousDependencies = useRef<DependencyList>(dependencies);

  if (objectRef.current == null) {
    objectRef.current = factory();
  }

  const object = useMemo(() => {
    let newObject = objectRef.current;
    const dependenciesAreEqual =
      previousDependencies.current?.length === dependencies.length &&
      dependencies.every((value, index) => value === previousDependencies.current[index]);

    // If the dependencies have changed, release the previous object and create a new one, otherwise this has been called
    // because of an unrelated fast refresh, and we don't want to release the object.
    if (!newObject || !dependenciesAreEqual) {
      objectRef.current?.release();
      newObject = factory();
      objectRef.current = newObject;
      previousDependencies.current = dependencies;
    }
    return newObject;
  }, dependencies);

  useMemo(() => {
    isFastRefresh.current = true;
  }, []);

  useEffect(() => {
    isFastRefresh.current = false;

    return () => {
      // This will be called on every fast refresh and on unmount, but we only want to release the object on unmount.
      if (!isFastRefresh.current && objectRef.current) {
        objectRef.current.release();
      }
    };
  }, []);

  return object;
}
