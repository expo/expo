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
//# sourceMappingURL=useNativeState.d.ts.map