'use client';

import type { DependencyList } from 'react';
import { useEffect, useInsertionEffect, useRef } from 'react';

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
   * Creates the shared object when the hook initializes or dependencies require a new object.
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
   * If a subsequent dependency change or unmount requires the object to be released while
   * async updates are still in-flight, the release is deferred until all of them settle.
   */
  update?: (
    object: TSharedObject,
    context: ReleasingSharedObjectLifecycleContext
  ) => void | Promise<void>;

  /**
   * Releases an object after it has been replaced or when the component unmounts.
   * When omitted, the object's `release` method is called.
   *
   * > Note: `release` won't be called when the SharedObject is mounted inside a hidden [`Activity`](https://react.dev/reference/react/Activity) which gets unmounted.
   * > Once the related JavaScript object is garbage collected, only the native object will be released.
   */
  release?: (object: TSharedObject) => void;
};

type Snapshot<TSharedObject extends SharedObject> = {
  resource: SharedObjectResource<TSharedObject>;
  dependencies: DependencyList;
};

function dependenciesAreEqual(previousDependencies: DependencyList, dependencies: DependencyList) {
  return (
    previousDependencies.length === dependencies.length &&
    dependencies.every((value, index) => Object.is(value, previousDependencies[index]))
  );
}

function selectSnapshot<TSharedObject extends SharedObject>(
  lifecycle: ReleasingSharedObjectLifecycle<TSharedObject>,
  dependencies: DependencyList,
  candidate: Snapshot<TSharedObject> | undefined,
  committed: Snapshot<TSharedObject> | undefined
): Snapshot<TSharedObject> {
  if (
    candidate &&
    !candidate.resource.isDisposed &&
    dependenciesAreEqual(candidate.dependencies, dependencies)
  ) {
    return candidate;
  }

  const previous = committed?.resource.isDisposed ? undefined : committed;
  if (previous && dependenciesAreEqual(previous.dependencies, dependencies)) {
    return previous;
  }

  if (
    previous &&
    previous.resource.object != null &&
    lifecycle.shouldRecreate?.(previous.resource.object, {
      previousDependencies: previous.dependencies,
      dependencies,
    }) === false
  ) {
    return { resource: previous.resource, dependencies: [...dependencies] };
  }

  return {
    resource: new SharedObjectResource(lifecycle.factory()),
    dependencies: [...dependencies],
  };
}

/**
 * Returns a shared object, delegating dependency changes to lifecycle callbacks.
 *
 * > **important** Due to React component lifecycle limitations, when a component is unmounted while inside a hidden React
 * > [`Activity`](https://react.dev/reference/react/Activity), its shared object stays alive until
 * > its JavaScript object is garbage-collected.
 */
export function useReleasingSharedObjectWithLifecycle<TSharedObject extends SharedObject>(
  lifecycle: ReleasingSharedObjectLifecycle<TSharedObject>,
  dependencies: DependencyList
): TSharedObject {
  const state = useRef<{
    candidate?: Snapshot<TSharedObject>;
    committed?: Snapshot<TSharedObject>;
  }>({});

  // Cache the render's selection, but base lifecycle decisions on the last commit.
  // An interrupted render must not update or release the committed object.
  const selected = selectSnapshot(
    lifecycle,
    dependencies,
    state.current.candidate,
    state.current.committed
  );
  state.current.candidate = selected;
  const resource = selected.resource;

  // Use an insertion effect so hiding an [`Activity`](https://react.dev/reference/react/Activity) does not release the object.
  // Save the latest committed release callback for when the object is eventually released.
  useInsertionEffect(() => {
    resource.release = lifecycle.release ?? ((object) => object?.release());
    return resource.retain();
  });

  // Keep the object retained after insertion cleanup so consumers can still call it from
  // useEffect cleanup (e.g. player.pause()). `useInsertionEffect` cleanup runs before `useEffect` cleanup
  useEffect(() => resource.retain(), [resource]);

  // Apply committed dependency changes once, including when effects replay or reconnect.
  useEffect(() => {
    const previous = state.current.committed;
    state.current.committed = selected;

    if (
      previous?.resource === resource &&
      !dependenciesAreEqual(previous.dependencies, selected.dependencies)
    ) {
      resource.track(
        lifecycle.update?.(resource.object, {
          previousDependencies: previous.dependencies,
          dependencies: selected.dependencies,
        })
      );
    }
  });

  return resource.object;
}

// Pending work and disposal belong to each object, including objects replaced by a later render.
class SharedObjectResource<TSharedObject extends SharedObject> {
  // Effects and pending updates each retain the object for as long as they need it.
  private retainCount = 0;
  private disposed = false;
  release: (object: TSharedObject) => void = (object) => object?.release();

  constructor(readonly object: TSharedObject) {}

  get isDisposed() {
    return this.disposed;
  }

  retain() {
    if (this.disposed) {
      throw new Error(
        'Cannot reuse a released shared object. Remount the component to create a new one.'
      );
    }
    this.retainCount++;
    return () => {
      if (--this.retainCount > 0) return;
      // Recheck after effect replay and synchronous consumer cleanup have finished.
      Promise.resolve()
        .then(() => {
          if (this.retainCount === 0 && !this.disposed) {
            this.disposed = true;
            console.log('Release object');
            if (this.object != null) this.release(this.object);
          }
        })
        .catch((error) => console.error(error));
    };
  }

  // Keeps the shared object alive until the provided task finishes
  track(task: void | Promise<void>) {
    if (!task) return;
    const releaseUpdate = this.retain();
    Promise.resolve(task)
      .catch((error) => console.error(error))
      .then(releaseUpdate);
  }
}
