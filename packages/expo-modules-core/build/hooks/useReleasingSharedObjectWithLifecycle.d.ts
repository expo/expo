import type { DependencyList } from 'react';
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
    shouldRecreate?: (object: TSharedObject, context: ReleasingSharedObjectLifecycleContext) => boolean;
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
    update?: (object: TSharedObject, context: ReleasingSharedObjectLifecycleContext) => void | Promise<void>;
    /**
     * Releases an object after it has been replaced or when the component unmounts.
     * When omitted, the object's `release` method is called.
     */
    release?: (object: TSharedObject) => void;
};
/**
 * Returns a shared object, delegating dependency changes to lifecycle callbacks.
 */
export declare function useReleasingSharedObjectWithLifecycle<TSharedObject extends SharedObject>(lifecycle: ReleasingSharedObjectLifecycle<TSharedObject>, dependencies: DependencyList): TSharedObject;
//# sourceMappingURL=useReleasingSharedObjectWithLifecycle.d.ts.map