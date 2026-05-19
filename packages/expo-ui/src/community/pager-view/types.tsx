import type { ReactNode, Ref } from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

/**
 * Event payload for `onPageScroll`. Mirrors the upstream
 * `react-native-pager-view` shape.
 */
export type PagerViewOnPageScrollEventData = Readonly<{
  position: number;
  offset: number;
}>;

/**
 * Event payload for `onPageSelected`. Mirrors the upstream
 * `react-native-pager-view` shape.
 */
export type PagerViewOnPageSelectedEventData = Readonly<{
  position: number;
}>;

/**
 * Event payload for `onPageScrollStateChanged`. Mirrors the upstream
 * `react-native-pager-view` shape.
 */
export type PageScrollStateChangedEventData = Readonly<{
  pageScrollState: 'idle' | 'dragging' | 'settling';
}>;

export type PagerViewOnPageScrollEvent = NativeSyntheticEvent<PagerViewOnPageScrollEventData>;
export type PagerViewOnPageSelectedEvent = NativeSyntheticEvent<PagerViewOnPageSelectedEventData>;
export type PageScrollStateChangedEvent = NativeSyntheticEvent<PageScrollStateChangedEventData>;

/**
 * Wraps a payload as `NativeSyntheticEvent`. We only populate `nativeEvent`
 * since our consumers (mirroring upstream `react-native-pager-view`) read
 * only `event.nativeEvent.X`; the unset SyntheticEvent fields would never
 * be observed in practice.
 */
export const wrapNativeEvent = <T,>(nativeEvent: T): NativeSyntheticEvent<T> => {
  'worklet';
  return { nativeEvent } as NativeSyntheticEvent<T>;
};

/**
 * Props for the `PagerView` component.
 * Compatible with `react-native-pager-view`.
 */
export type PagerViewProps = ViewProps & {
  /**
   * Ref handle exposing imperative `setPage`, `setPageWithoutAnimation`,
   * and `setScrollEnabled` methods.
   */
  ref?: Ref<PagerViewRef>;
  /**
   * Index of the page that is initially selected. Read **once** on mount;
   * later changes are ignored. To navigate after mount, call
   * `ref.setPage()` or `ref.setPageWithoutAnimation()`.
   * @default 0
   */
  initialPage?: number;
  /**
   * Whether the user can swipe between pages.
   * @default true
   */
  scrollEnabled?: boolean;
  /**
   * Layout direction for paging.
   * @default 'ltr'
   * @platform android
   */
  layoutDirection?: 'ltr' | 'rtl';
  /**
   * Number of pages kept off-screen on each side of the visible page.
   * @platform android
   */
  offscreenPageLimit?: number;
  /**
   * Pixels of padding between pages.
   * @platform android
   */
  pageMargin?: number;
  /**
   * Fires continuously while a swipe is in progress. The event's `position`
   * is the index of the leading visible page; `offset` is the fractional
   * progress toward the next page in the `[0, 1)` range.
   *
   * **iOS 18+ only.**
   */
  onPageScroll?: (event: PagerViewOnPageScrollEvent) => void;
  /**
   * Fires when a page is fully selected. The event's `position` is the
   * index of the new page.
   */
  onPageSelected?: (event: PagerViewOnPageSelectedEvent) => void;
  /**
   * Fires when the scroll state changes between `idle`, `dragging`,
   * and `settling`.
   *
   * **iOS 18+ only.**
   */
  onPageScrollStateChanged?: (event: PageScrollStateChangedEvent) => void;
  /**
   * Pages of the pager. Each child is treated as a separate page and
   * stretched to fill the pager. Each child should have a stable `key`.
   */
  children?: ReactNode;
};

/**
 * Ref handle for the `PagerView` component.
 * Compatible with `react-native-pager-view`.
 */
export type PagerViewRef = {
  /**
   * Animate the pager to the given page index. Out-of-range indices are
   * silently ignored. On iOS the animation requires `react-native-worklets`;
   * without it, `setPage` falls back to a non-animated jump.
   */
  setPage: (selectedPage: number) => void;
  /**
   * Jump to the given page index without an animation.
   */
  setPageWithoutAnimation: (selectedPage: number) => void;
  /**
   * Imperatively enable or disable user scrolling — convenient when
   * toggling from a non-React context like a ref-based gesture handler.
   *
   * > **Note:** If the `scrollEnabled` prop is also provided, subsequent
   * > prop changes win and reset the value set imperatively. To use the
   * > imperative path exclusively, omit the prop.
   *
   * > Unlike upstream `react-native-pager-view` (which calls UIManager
   * > directly), this triggers a re-render of `PagerView` so the new
   * > flag flows through to the native view via props.
   */
  setScrollEnabled: (scrollEnabled: boolean) => void;
};
