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
     * Sets the value inside SwiftUI's `withAnimation` transaction so views that
     * observe this state (for example, `.scrollPosition(id:)`) animate to the
     * new value. On platforms where the underlying API has no equivalent, this
     * is treated as an instant write.
     *
     * Writing from the JS thread triggers a development-time warning. To
     * silence it, route the write through the UI runtime — easiest is the
     * `writeStateOnUI` helper from this module, which wraps the call in
     * `scheduleOnUI`.
     *
     * @platform ios
     */
    setValueAnimated(value: T): void;
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
    onChange: {
        listener(value: T): void;
    }['listener'] | null;
};
/**
 * Creates an observable native state that is automatically cleaned up when the
 * component unmounts. `initialValue` is captured once on the first render
 */
export declare function useNativeState<T>(initialValue: T): ObservableState<T>;
/**
 * Writes `value` into the observable state on the native UI runtime — wraps
 * the call in `scheduleOnUI` so the mutation happens on the same thread
 * SwiftUI observes, avoiding the JS-thread dev warning. Pass `animated: true`
 * to wrap the write in SwiftUI's `withAnimation` transaction (iOS-only;
 * elsewhere it falls back to an instant write).
 *
 * Implementation note: worklets bypass the JS-side `defineProperty` sugar
 * (`state.value =`, `state.setValueAnimated(v)`), so the worklet body calls
 * the underlying native SharedObject methods directly with their wrapped
 * signature (`{ value }`). The asymmetry is hidden inside this helper; call
 * sites pass plain values.
 *
 * When `react-native-worklets` is not installed, falls back to a JS-thread
 * write (which trips the dev warning — a one-time signal that the project
 * isn't set up for worklet-routed writes).
 */
export declare function writeStateOnUI<T>(state: ObservableState<T>, value: T, options?: {
    animated?: boolean;
}): void;
//# sourceMappingURL=useNativeState.d.ts.map