import type { Ref } from 'react';
import { type ModifierConfig } from '../../types';
import { type PaddingValuesRecord } from '../Carousel';
export type { PaddingValuesRecord };
export type HorizontalPagerHandle = {
    /**
     * Mirrors Compose's `PagerState.animateScrollToPage`. Resolves when the
     * animation completes.
     */
    animateScrollToPage: (page: number) => Promise<void>;
    /**
     * Mirrors Compose's `PagerState.scrollToPage`. Jumps without animation.
     */
    scrollToPage: (page: number) => Promise<void>;
};
/**
 * Kind of drag interaction reported by `onDragInteraction`. Mirrors Compose's
 * `DragInteraction.Start` / `DragInteraction.Stop` / `DragInteraction.Cancel`.
 */
export type HorizontalPagerDragInteraction = 'start' | 'stop' | 'cancel';
export interface HorizontalPagerProps {
    /**
     * Imperative handle for programmatic navigation. Mirrors the methods on
     * Compose's `PagerState`.
     */
    ref?: Ref<HorizontalPagerHandle>;
    /**
     * Page to mount on. Mirrors `rememberPagerState(initialPage = …)`. Subsequent
     * changes have no effect — use the ref methods to navigate after mount.
     * @default 0
     */
    initialPage?: number;
    /**
     * Fires when Compose's `PagerState.currentPage` changes — i.e. when the page
     * closest to the snap position flips, including mid-swipe as the user
     * crosses between pages.
     */
    onCurrentPageChange?: (page: number) => void;
    /**
     * Fires when Compose's `PagerState.settledPage` changes — i.e. after a
     * swipe or programmatic scroll has fully settled.
     */
    onSettledPageChange?: (page: number) => void;
    /**
     * Fires continuously while a swipe is in progress. Mirrors Compose's
     * `PagerState.currentPage` and `currentPageOffsetFraction` — the latter is
     * the signed fractional offset from `currentPage`, in the `[-0.5, 0.5]` range.
     *
     * If the callback is marked with the `'worklet'` directive, it runs
     * synchronously on the UI thread; otherwise it is delivered asynchronously
     * as a regular JS event.
     */
    onPageScroll?: (currentPage: number, currentPageOffsetFraction: number) => void;
    /**
     * Fires when Compose's `PagerState.isScrollInProgress` toggles — true while
     * the pager is being dragged or animating to a snap target, false once it
     * has settled.
     */
    onScrollInProgressChange?: (isScrollInProgress: boolean) => void;
    /**
     * Fires for each drag interaction emitted by `PagerState.interactionSource`.
     * Combine with `onScrollInProgressChange` to distinguish user dragging from
     * fling/snap-settling.
     */
    onDragInteraction?: (kind: HorizontalPagerDragInteraction) => void;
    /**
     * Spacing between pages in dp.
     * @default 0
     */
    pageSpacing?: number;
    /**
     * Padding for pager content (dp or per-side object).
     * @default 0
     */
    contentPadding?: number | PaddingValuesRecord;
    /**
     * Whether the user can scroll the pager by swiping.
     * @default true
     */
    userScrollEnabled?: boolean;
    /**
     * Whether to reverse the layout direction.
     * @default false
     */
    reverseLayout?: boolean;
    /**
     * Number of pages to compose and keep beyond the visible viewport.
     * @default 0
     */
    beyondViewportPageCount?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children to render as pages.
     */
    children: React.ReactNode;
}
/**
 * A horizontally scrolling pager that snaps to individual pages,
 * matching Compose's `HorizontalPager`.
 */
export declare function HorizontalPager(props: HorizontalPagerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map