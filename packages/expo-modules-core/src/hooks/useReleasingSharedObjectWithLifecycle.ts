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
   * Called during render when dependencies change to decide whether to replace the object.
   * Return `false` to keep the current object and handle the dependency change with the `update` function.
   * When omitted or `true`, dependency changes recreate the object, matching `useReleasingSharedObject`.
   *
   * Must be a pure function with no side effects — it is called during the render phase and
   * React may invoke it more than once with the same inputs.
   */
  shouldRecreate?: (
    object: TSharedObject,
    context: ReleasingSharedObjectLifecycleContext
  ) => boolean;

  /**
   * Called after commit when dependencies changed and `shouldRecreate` returned `false`.
   * Has no effect unless `shouldRecreate` is provided and returns `false` for the changed
   * dependencies.
   *
   * If the returned `Promise` rejects, the error is logged with `console.error`. Handle errors
   * inside `update` if specific error handling is needed.
   *
   * If a subsequent dependency change or unmount requires the object to be released while an
   * async update is still in-flight, the release is deferred until the update settles.
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
  const pendingUpdatePromiseRef = useRef<Promise<void> | null>(null);
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

  function releaseObject(obj: TSharedObject) {
    (lifecycleRef.current.release ?? ((o: TSharedObject) => o.release()))(obj);
  }

  useEffect(() => {
    // When the object changes, release the previous one - it is important to do this in a useEffect, so that we don't release
    // the object during render. If an async update is still in-flight, defer the release until it settles.
    if (objectRefToRelease.current) {
      const toRelease = objectRefToRelease.current;
      objectRefToRelease.current = null;
      const doRelease = () => releaseObject(toRelease);
      if (pendingUpdatePromiseRef.current) {
        pendingUpdatePromiseRef.current.then(doRelease, doRelease);
      } else {
        doRelease();
      }
    }

    if (pendingUpdateRef.current) {
      const pendingUpdate = pendingUpdateRef.current;
      pendingUpdateRef.current = null;
      const result = lifecycleRef.current.update?.(pendingUpdate.object, pendingUpdate.context);
      if (result instanceof Promise) {
        pendingUpdatePromiseRef.current = result;
        result.then(
          () => {
            pendingUpdatePromiseRef.current = null;
          },
          (error) => {
            pendingUpdatePromiseRef.current = null;
            console.error(error);
          }
        );
      }
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
        const obj = objectRef.current;
        const doRelease = () => releaseObject(obj);
        if (pendingUpdatePromiseRef.current) {
          pendingUpdatePromiseRef.current.then(doRelease, doRelease);
        } else {
          doRelease();
        }
      }
    };
  }, []);

  return object;
}
