import { type SharedObject } from 'expo-modules-core';
/**
 * Observable state shared between JavaScript and native SwiftUI views.
 */
export type ObservableState<T> = SharedObject & {
    /**
     * The current value. Read or write directly.
     */
    value: T;
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
/**
 * Registers a custom serializer so SharedObjects automatically work in worklets.
 * Call it after `installOnUIRuntime()`.
 */
export declare function registerSharedObjectSerializer(): void;
//# sourceMappingURL=index.d.ts.map