import { type PagerViewProps } from './types';
/**
 * Drop-in replacement for `react-native-pager-view` on iOS.
 *
 * Renders a SwiftUI `ScrollView` with paging behavior. Scroll position is the
 * single source of truth: an `ObservableState` bound through the
 * `scrollPosition` modifier drives initial placement, user-swipe writeback,
 * and imperative `setPage` / `setPageWithoutAnimation`. The animated path
 * routes the write through `withAnimation` so the state mutation lands inside
 * SwiftUI's animation transaction; if `react-native-worklets` isn't
 * installed, `setPage` falls back to a non-animated jump. Requires iOS 17+.
 * Continuous progress (`onPageScroll`) and scroll state
 * (`onPageScrollStateChanged`) require iOS 18+ — on iOS 17 the pager still
 * works but those specific events do not fire.
 */
export declare function PagerView(props: PagerViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PagerView.ios.d.ts.map