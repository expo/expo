import { type SharedObject } from 'expo-modules-core';
/**
 * Observable state shared between JavaScript and native views (Jetpack Compose
 * on Android and SwiftUI on iOS).
 */
export type ObservableState<T> = SharedObject & {
    /**
     * The current value.
     *
     * Writes from a UI worklet are synchronous and immediately readable. Writes
     * from the JS thread are scheduled to the UI thread asynchronously, the new value is not readable until the update has been
     * applied. Prefer writing from a worklet when you need synchronous updates
     */
    value: T;
    /**
     * A single listener invoked on the native UI runtime whenever the value changes
     * (after iOS `didSet` and Android's setter). Assigning replaces the previous
     * listener; assign `null` to clear. The initial value does not fire `onChange`.
     *
     * The callback must be a worklet so it can run synchronously on the UI thread.
     * Attach it inside `useEffect` and clear it in the cleanup so the listener
     * lifecycle matches the component lifecycle.
     *
     * @example
     * ```tsx
     * const state = useNativeState(0);
     *
     * useEffect(() => {
     *   state.onChange = (value) => {
     *     'worklet';
     *     console.log('changed to', value);
     *   };
     *   return () => {
     *     state.onChange = null;
     *   };
     * }, []);
     * ```
     */
    onChange: ((value: T) => void) | null;
};
/**
 * Creates an observable native state that is automatically cleaned up when the
 * component unmounts. `initialValue` is captured once on the first render
 */
export declare function useNativeState<T>(initialValue: T): ObservableState<T>;
//# sourceMappingURL=useNativeState.d.ts.map