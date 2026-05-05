import { type PagerViewProps } from './types';
/**
 * Drop-in replacement for `react-native-pager-view` on iOS.
 *
 * Renders a SwiftUI `ScrollView` with paging behavior. Initial placement,
 * imperative navigation, and `onPageSelected` are driven by SwiftUI's
 * `.scrollPosition(id:)` binding, which requires iOS 17+. Continuous
 * progress (`onPageScroll`) and scroll state (`onPageScrollStateChanged`)
 * additionally require iOS 18+ — on iOS 17 the pager still works but those
 * specific events do not fire.
 */
export declare function PagerView(props: PagerViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PagerView.ios.d.ts.map