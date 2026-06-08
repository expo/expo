/**
 * Shared hook for onAppear/onDisappear lifecycle callbacks.
 * Uses refs so the latest callback is always invoked, even if the parent
 * re-renders with a new function reference.
 */
export declare function useUniversalLifecycle(onAppear?: () => void, onDisappear?: () => void): void;
/**
 * Tracks whether the element should display a keyboard focus indicator,
 * mirroring the browser's `:focus-visible` heuristic. Spread the returned
 * `onFocus`/`onBlur` onto a focusable element (e.g. `Pressable`) and read
 * `focusVisible` to conditionally apply focus styles.
 */
export declare function useFocusVisible(): {
    focusVisible: boolean;
    onFocus: () => void;
    onBlur: () => void;
};
//# sourceMappingURL=hooks.d.ts.map