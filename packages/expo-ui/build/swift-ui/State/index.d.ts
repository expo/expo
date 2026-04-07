import { type SharedObject } from 'expo-modules-core';
/**
 * Observable state shared between JavaScript and native SwiftUI views.
 */
export type ObservableState<T> = SharedObject & {
    /**
     * Returns the current value.
     */
    getValue(): T;
    /**
     * Sets a new value, triggering SwiftUI updates.
     */
    setValue(value: T): void;
};
/**
 * Creates an observable native state that is automatically cleaned up when the component unmounts.
 */
export declare function useNativeState<T>(initialValue: T): ObservableState<T>;
/**
 * Extracts the native shared object ID from a SharedObject instance.
 * Used internally to pass SharedObject references as view props.
 */
export declare function getStateId(state?: object): number | undefined;
//# sourceMappingURL=index.d.ts.map