import { useMemo } from 'react';

import { type ObservableState, useNativeState } from '../../State/useNativeState';

// Sealed accessor for the internal command observable.
export const COMMAND_STATE_SYMBOL = Symbol('horizontalPagerCommand');

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
   * Treat as read-only — use `animateScrollToPage` / `scrollToPage` to scroll.
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
 * navigation.
 */
export function usePagerNativeState({
  initialPage = 0,
}: { initialPage?: number } = {}): PagerNativeState {
  const safeInitialPage = Math.max(0, initialPage);
  const currentPage = useNativeState<number>(safeInitialPage);
  const command = useNativeState<PagerCommand>({
    page: safeInitialPage,
    animated: false,
    seq: 0,
  });

  return useMemo(() => {
    const sendCommand = (page: number, animated: boolean) => {
      const prevSeq = command.value?.seq ?? 0;
      command.value = { page: Math.max(0, page), animated, seq: prevSeq + 1 };
    };
    return {
      currentPage: __DEV__ ? wrapCurrentPageWithWriteWarning(currentPage) : currentPage,
      animateScrollToPage: (page: number) => sendCommand(page, true),
      scrollToPage: (page: number) => sendCommand(page, false),
      [COMMAND_STATE_SYMBOL]: command,
    };
  }, [currentPage, command]);
}

function wrapCurrentPageWithWriteWarning(state: ObservableState<number>): ObservableState<number> {
  let warned = false;
  return new Proxy(state, {
    set(target, prop, value) {
      if (prop === 'value' && !warned) {
        warned = true;
        console.warn(
          '[expo-ui] Writing to `pagerState.currentPage.value` has no effect on the pager. ' +
            'Use `pagerState.animateScrollToPage(...)` or `pagerState.scrollToPage(...)` to navigate.'
        );
      }
      (target as unknown as Record<string | symbol, unknown>)[prop] = value;
      return true;
    },
  });
}
