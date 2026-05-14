import type { Ref } from 'react';
import { type CommonViewModifierProps } from '../types';
/**
 * Scroll phase emitted by `onScrollPhaseChange`. Mirrors SwiftUI's `ScrollPhase`
 * (iOS 18+).
 */
export type ScrollPhase = 'idle' | 'tracking' | 'interacting' | 'animating' | 'decelerating';
/**
 * Snapshot of a `ScrollView`'s scroll geometry, emitted by
 * `onScrollGeometryChange` (iOS 18+).
 */
export type ScrollGeometry = {
    /** Horizontal content offset, in points. */
    contentOffsetX: number;
    /** Vertical content offset, in points. */
    contentOffsetY: number;
    /** Width of the visible scroll container, in points. */
    containerWidth: number;
    /** Height of the visible scroll container, in points. */
    containerHeight: number;
    /** Total width of the scrollable content, in points. */
    contentWidth: number;
    /** Total height of the scrollable content, in points. */
    contentHeight: number;
};
/**
 * Imperative handle exposed by `ScrollView` via its `ref`.
 */
export type ScrollViewRef = {
    /**
     * Scrolls so the child carrying `id(targetId)` is aligned with the leading
     * edge of the scroll container. When `animated` is true the transition is
     * wrapped in SwiftUI's `withAnimation`. Backed by `ScrollViewProxy.scrollTo`,
     * available on iOS 14+.
     *
     * For declarative state-driven scrolling, use the `scrollPosition(...)`
     * modifier with `useNativeState` instead.
     */
    scrollToId: (targetId: string, animated: boolean) => Promise<void>;
};
export type ScrollViewProps = {
    ref?: Ref<ScrollViewRef>;
    children: React.ReactNode;
    /**
     * The scrollable axes. Pass `'both'` to enable 2D (horizontal + vertical) scrolling.
     * @default 'vertical'
     */
    axes?: 'vertical' | 'horizontal' | 'both';
    /**
     * Whether to show scroll indicators. For richer visibility control (e.g. `'never'`)
     * or per-axis control, use the `scrollIndicators(...)` modifier instead.
     * @default true
     */
    showsIndicators?: boolean;
    /**
     * Fires when SwiftUI's scroll phase changes (e.g., user begins dragging,
     * the scroll view starts decelerating, or scrolling settles to idle). The
     * second argument is the scroll geometry sampled at the phase transition,
     * useful for reading the final offset on settle without subscribing to
     * per-frame `onScrollGeometryChange`.
     *
     * Requires iOS 18 or later. No-op on earlier iOS versions.
     */
    onScrollPhaseChange?: (phase: ScrollPhase, geometry: ScrollGeometry) => void;
    /**
     * Fires when the scroll geometry changes — i.e., on every scroll update
     * and on container/content size changes. Use to drive continuous progress
     * UI such as page indicators, parallax, or fractional offsets.
     *
     * If the callback is marked with the `'worklet'` directive, it runs
     * synchronously on the UI thread; otherwise it is delivered asynchronously
     * as a regular JS event.
     *
     * Requires iOS 18 or later. No-op on earlier iOS versions.
     */
    onScrollGeometryChange?: (geometry: ScrollGeometry) => void;
} & CommonViewModifierProps;
export declare function ScrollView(props: ScrollViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map