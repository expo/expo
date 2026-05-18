import { type SharedObject } from 'expo-modules-core';
/**
 * Observable state shared between JavaScript and native views (Jetpack Compose
 * on Android and SwiftUI on iOS).
 */
export type ObservableState<T> = SharedObject & {
    /**
     * The current value. Reads are safe from any thread; prefer writing from a worklet
     * so the update runs on the native UI thread. Updating state from the JS thread
     * might show a development warning.
     */
    value: T;
};
/**
 * Creates an observable native state that is automatically cleaned up when the
 * component unmounts. `initialValue` is captured once on the first render
 */
export declare function useNativeState<T>(initialValue: T): ObservableState<T>;
//# sourceMappingURL=useNativeState.d.ts.map