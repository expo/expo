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
     * Return `true` to release the current object and create a new one after the dependencies change.
     * When omitted, dependency changes recreate the object, matching `useReleasingSharedObject`.
     */
    shouldRecreate?: (object: TSharedObject, context: ReleasingSharedObjectLifecycleContext) => boolean;
    /**
     * Updates the current object after commit when dependencies changed and `shouldRecreate`
     * returned `false`.
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