import type { EventSubscription } from 'expo-modules-core';
/**
 * Gets the value of shared state for a given key.
 *
 * @param key The key to get the value for.
 */
export declare function getSharedStateValue<T = any>(key: string): T | undefined;
/**
 * Sets the value of shared state for a given key.
 *
 * @param key The key to set the value for.
 * @param value The value to be set.
 */
export declare function setSharedStateValue<T = any>(key: string, value: T): void;
/**
 * Deletes the shared state for a given key.
 *
 * @param key The key to delete the shared state for.
 */
export declare function deleteSharedState(key: string): void;
/**
 * Adds a listener for changes to the shared state for a given key.
 *
 * @param key The key to add the listener for.
 * @param callback The callback to be called when the shared state changes.
 * @returns A subscription object that can be used to remove the listener.
 */
export declare function addSharedStateListener<T = any>(key: string, callback: (value: T | undefined) => void): EventSubscription;
/**
 * Hook to observe and set the value of shared state for a given key.
 * Provides a synchronous API similar to `useState`.
 *
 * @param key The key to get the value for.
 * @param initialValue The initial value to be used if the shared state is not set.
 * @returns A tuple containing the value and a function to set the value.
 */
export declare function useSharedState<T = any>(key: string, initialValue?: T): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void];
//# sourceMappingURL=ExpoBrownfieldStateModule.d.ts.map