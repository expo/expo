/**
 * Shared hook for onAppear/onDisappear lifecycle callbacks.
 * Uses refs so the latest callback is always invoked, even if the parent
 * re-renders with a new function reference.
 */
export declare function useUniversalLifecycle(onAppear?: () => void, onDisappear?: () => void): void;
//# sourceMappingURL=hooks.d.ts.map