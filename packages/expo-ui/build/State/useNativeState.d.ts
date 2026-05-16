import { type SharedObject } from 'expo-modules-core';
/**
 * Observable state shared between JavaScript and native views (Jetpack Compose
 * on Android and SwiftUI on iOS).
 */
export type ObservableState<T> = SharedObject & {
    /**
     * The current value. Reads and writes are safe from any thread.
     *
     * On iOS, JS-thread writes hop to the main thread to apply, which adds a
     * small synchronous wait per write. For frequent updates (typing, gestures,
     * animations) prefer writing from a worklet so the update applies directly
     * on the UI thread.
     */
    value: T;
};
/**
 * Creates an observable native state that is automatically cleaned up when the
 * component unmounts. `initialValue` is captured once on the first render
 */
export declare function useNativeState<T>(initialValue: T): ObservableState<T>;
//# sourceMappingURL=useNativeState.d.ts.map