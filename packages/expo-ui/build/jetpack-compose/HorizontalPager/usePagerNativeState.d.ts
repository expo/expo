import { type ObservableState } from '../../State/useNativeState';
export declare const COMMAND_STATE_SYMBOL: unique symbol;
/**
 * State object returned from `usePagerNativeState`. Pass it to `<HorizontalPager state={…} />`
 * to drive the pager from JS or read its current settled page from a worklet.
 */
export type PagerNativeState = {
    /**
     * Observable holding the current settled page index. Native writes to it whenever
     * the pager settles (after a swipe or after a programmatic scroll completes).
     * Read from worklets via `state.currentPage.value` without crossing the bridge.
     *
     * Treat as read-only — use `animateScrollToPage` / `scrollToPage` to scroll. In
     * dev builds, writing to `currentPage.value` warns; in production it has no effect
     * on the pager (the next settle overwrites it).
     */
    currentPage: ObservableState<number>;
    /**
     * Animate to the given page index. The animation runs on the UI thread; this
     * call returns immediately.
     */
    animateScrollToPage: (page: number) => void;
    /**
     * Jump to the given page index without animation.
     */
    scrollToPage: (page: number) => void;
    /** @internal — accessed only via `COMMAND_STATE_SYMBOL`. */
    [COMMAND_STATE_SYMBOL]: ObservableState<PagerCommand>;
};
type PagerCommand = {
    page: number;
    animated: boolean;
    seq: number;
};
/**
 * Creates the state object for a `<HorizontalPager>`. The returned handle exposes
 * `currentPage` for reads and `animateScrollToPage` / `scrollToPage` for programmatic
 * navigation. State is shared with the native side via `ObservableState`, so reads
 * from worklets don't cross the JS bridge.
 */
export declare function usePagerNativeState({ initialPage }?: {
    initialPage?: number;
}): PagerNativeState;
export {};
//# sourceMappingURL=usePagerNativeState.d.ts.map