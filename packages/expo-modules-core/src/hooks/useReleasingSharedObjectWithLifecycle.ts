'use client';

import type { DependencyList } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import type { SharedObject } from '../ts-declarations/SharedObject';

export type ReleasingSharedObjectLifecycleContext = {
  /**
   * The dependency values from the last committed object lifecycle decision.
   */
  previousDependencies: DependencyList;

  /**
   * The dependency values from the current render.
   */
  dependencies: DependencyList;
};

export type ReleasingSharedObjectLifecycle<TSharedObject extends SharedObject> = {
  /**
   * Creates the shared object when the hook initializes or when `shouldRecreate` returns `true`.
   */
  factory: () => TSharedObject;

  /**
   * Return `true` to release the current object and create a new one after the dependencies change.
   * When omitted, dependency changes recreate the object, matching `useReleasingSharedObject`.
   */
  shouldRecreate?: (
    object: TSharedObject,
    context: ReleasingSharedObjectLifecycleContext
  ) => boolean;

  /**
   * Updates the current object after commit when dependencies changed and `shouldRecreate`
   * returned `false`.
   */
  update?: (
    object: TSharedObject,
    context: ReleasingSharedObjectLifecycleContext
  ) => void | Promise<void>;

  /**
   * Releases an object after it has been replaced or when the component unmounts.
   * When omitted, the object's `release` method is called.
   */
  release?: (object: TSharedObject) => void;
};

type PendingUpdate<TSharedObject extends SharedObject> = {
  object: TSharedObject;
  context: ReleasingSharedObjectLifecycleContext;
};

function dependenciesAreEqual(previousDependencies: DependencyList, dependencies: DependencyList) {
  return (
    previousDependencies.length === dependencies.length &&
    dependencies.every((value, index) => value === previousDependencies[index])
  );
}

/**
 * Returns a shared object, delegating dependency changes to lifecycle callbacks.
 */
export function useReleasingSharedObjectWithLifecycle<TSharedObject extends SharedObject>(
  lifecycle: ReleasingSharedObjectLifecycle<TSharedObject>,
  dependencies: DependencyList
): TSharedObject {
  const objectRef = useRef<TSharedObject | null>(null);
  const objectRefToRelease = useRef<TSharedObject | null>(null);
  const pendingUpdateRef = useRef<PendingUpdate<TSharedObject> | null>(null);
  const isFastRefresh = useRef(false);
  const previousDependencies = useRef<DependencyList>(dependencies);
  const lifecycleRef = useRef(lifecycle);

  // Keep lifecycle callbacks fresh without making effects depend on the lifecycle object identity.
  lifecycleRef.current = lifecycle;

  if (objectRef.current == null) {
    objectRef.current = lifecycleRef.current.factory();
  }

  const object = useMemo(() => {
    let newObject = objectRef.current;
    const context = {
      previousDependencies: previousDependencies.current,
      dependencies,
    };

    // If the dependencies have changed, let the caller decide whether the object should be
    // replaced or updated in place. Otherwise this has been called because of an unrelated
    // fast refresh, and we don't want to release the object.
    if (!newObject || !dependenciesAreEqual(previousDependencies.current, dependencies)) {
      if (!newObject || (lifecycleRef.current.shouldRecreate?.(newObject, context) ?? true)) {
        objectRefToRelease.current = objectRef.current;
        newObject = lifecycleRef.current.factory();
        objectRef.current = newObject;
      } else if (lifecycleRef.current.update) {
        pendingUpdateRef.current = {
          object: newObject,
          context,
        };
      }
      previousDependencies.current = dependencies;
    }
    return newObject;
  }, dependencies);

  useEffect(() => {
    // When the object changes, release the previous one - it is important to do this in a useEffect, so that we don't release
    // the object during render.
    if (objectRefToRelease.current) {
      (lifecycleRef.current.release ?? ((object: TSharedObject) => object.release()))(
        objectRefToRelease.current
      );
      objectRefToRelease.current = null;
    }

    if (pendingUpdateRef.current) {
      const pendingUpdate = pendingUpdateRef.current;
      pendingUpdateRef.current = null;
      lifecycleRef.current.update?.(pendingUpdate.object, pendingUpdate.context);
    }
  }, dependencies);

  useMemo(() => {
    isFastRefresh.current = true;
  }, []);

  useEffect(() => {
    isFastRefresh.current = false;

    return () => {
      // This will be called on every fast refresh and on unmount, but we only want to release the object on unmount.
      if (!isFastRefresh.current && objectRef.current) {
        (lifecycleRef.current.release ?? ((object: TSharedObject) => object.release()))(
          objectRef.current
        );
      }
    };
  }, []);

  return object;
}
