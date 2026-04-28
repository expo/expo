export type ObservableState<T> = {
    value: T;
};
/**
 * Web polyfill for the native `useNativeState` hook. Returns a stable object
 * exposing a `value` getter/setter — writing the setter triggers a React
 * re-render so consumers can read the current value reactively.
 */
export declare function useNativeState<T>(initialValue: T): ObservableState<T>;
//# sourceMappingURL=State.d.ts.map