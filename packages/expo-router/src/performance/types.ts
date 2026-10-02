import type { NavigationAction } from '../react-navigation';
import type { unstable_PerformanceObserver } from './index';

/**
 * The page that a page mark describes.
 */
export interface RouterPageMarkDetail {
  /**
   * The pathname of the page, for example `/users/42`.
   */
  pathname: string;
  /**
   * The route and search params of the page.
   */
  params: Record<string, string | string[]>;
  /**
   * The route segments of the page, for example `['users', '[id]']`.
   */
  segments: string[];
  /**
   * The navigation route key of the screen. It stays the same while the screen is mounted.
   */
  screenId: string;
}

/**
 * The navigation action that an `expo-router:action-dispatched` mark describes.
 */
export interface RouterActionMarkDetail {
  /**
   * The type of the dispatched navigation action, for example `NAVIGATE`.
   */
  actionType: NavigationAction['type'];
}

/**
 * A performance entry recorded by Expo Router. It has the shape of a `PerformanceMark`.
 */
export interface RouterPerformanceEntry<Name extends string, Detail> {
  readonly entryType: 'mark';
  /**
   * The name of the mark, which also determines the shape of `detail`.
   */
  readonly name: Name;
  /**
   * The `performance.now()` time when Expo Router created the mark, in milliseconds.
   */
  readonly startTime: number;
  /**
   * Always `0`, because a mark is a single point in time.
   */
  readonly duration: 0;
  /**
   * The page or action data of the mark.
   */
  readonly detail: Detail;
}

/**
 * A screen that rendered as part of a preload (for example, `router.prefetch()`) and is not
 * focused. If the user later navigates to it, `expo-router:page-focused` is marked then.
 */
export type RouterPagePreloadedMark = RouterPerformanceEntry<
  'expo-router:page-preloaded',
  RouterPageMarkDetail
>;

/**
 * A screen became focused, after its content committed.
 */
export type RouterPageFocusedMark = RouterPerformanceEntry<
  'expo-router:page-focused',
  RouterPageMarkDetail
>;

/**
 * A focused screen lost focus.
 */
export type RouterPageBlurredMark = RouterPerformanceEntry<
  'expo-router:page-blurred',
  RouterPageMarkDetail
>;

/**
 * A screen unmounted, or its route info changed.
 */
export type RouterPageRemovedMark = RouterPerformanceEntry<
  'expo-router:page-removed',
  RouterPageMarkDetail
>;

/**
 * A navigation action changed the navigation state.
 */
export type RouterActionDispatchedMark = RouterPerformanceEntry<
  'expo-router:action-dispatched',
  RouterActionMarkDetail
>;

/**
 * A performance mark recorded by Expo Router. Check `name` to narrow the type of `detail`.
 */
export type RouterPerformanceMark =
  | RouterPagePreloadedMark
  | RouterPageFocusedMark
  | RouterPageBlurredMark
  | RouterPageRemovedMark
  | RouterActionDispatchedMark;

export type RouterPerformanceMarkName = RouterPerformanceMark['name'];

/**
 * The performance mark type with the given `name`, for example
 * `RouterPerformanceMarkByName<'expo-router:page-focused'>`.
 */
export type RouterPerformanceMarkByName<Name extends RouterPerformanceMarkName> = Extract<
  RouterPerformanceMark,
  { name: Name }
>;

/**
 * The list of entries passed to an `unstable_PerformanceObserver` callback.
 */
export interface RouterPerformanceObserverEntryList {
  getEntries(): RouterPerformanceMark[];
  getEntriesByName<Name extends RouterPerformanceMarkName>(
    name: Name,
    type?: string
  ): RouterPerformanceMarkByName<Name>[];
  getEntriesByType(type: string): RouterPerformanceMark[];
}

export type RouterPerformanceObserverCallback = (
  list: RouterPerformanceObserverEntryList,
  observer: unstable_PerformanceObserver
) => void;

export interface RouterPerformanceObserverInit {
  /**
   * The entry type to observe. Expo Router records only `mark` entries.
   */
  type: 'mark';
  /**
   * When `true`, the observer also receives the entries recorded before it started to observe.
   * @default false
   */
  buffered?: boolean;
}
