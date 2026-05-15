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
   * **Platform requirements**: Android has no minimum version. iOS 18+
   * (built on `onScrollGeometryChange`); on earlier iOS versions the prop
   * attaches but the callback never fires — a dev-mode warning is logged
   * so the silent degradation is visible.
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
   * **Platform requirements**: Android has no minimum version, and
   * synthesizes the state from Compose's drag interactions plus
   * `isScrollInProgress`. iOS 18+ (built on `onScrollPhaseChange`); on
   * earlier iOS versions the prop attaches but the callback never fires —
   * a dev-mode warning is logged so the silent degradation is visible.
   */
  onPageScrollStateChanged?: (event: PageScrollStateChangedEvent) => void;
  /**
   * Pages of the pager. Each child is treated as a separate page and
   * stretched to fill the pager. Each child should have a stable `key`.
   * Children are forwarded to a native host on each platform, so plain
   * React Native views can be passed directly.
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
   * silently ignored.
   */
  setPage: (selectedPage: number) => void;
  /**
   * Jump to the given page index without an animation.
   */
  setPageWithoutAnimation: (selectedPage: number) => void;
  /**
   * Imperatively enable or disable user scrolling. Equivalent to the
   * `scrollEnabled` prop, but useful when toggling without re-rendering.
   */
  setScrollEnabled: (scrollEnabled: boolean) => void;
};
