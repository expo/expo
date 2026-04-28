import { type ModifierConfig } from '../../types';
import type { PaddingValuesRecord } from '../Carousel';
export type HorizontalPagerProps = {
    /**
     * The index of the currently displayed page. When set, the pager is controlled
     * and page changes are driven by this prop.
     */
    currentPage?: number;
    /**
     * The initial page index for uncontrolled mode. Ignored when `currentPage` is set.
     * @default 0
     */
    defaultPage?: number;
    /**
     * Whether programmatic page changes (via `currentPage`) are animated.
     * @default true
     */
    animatePageChanges?: boolean;
    /**
     * Called when the settled page changes after a user swipe.
     */
    onPageSelected?: (position: number) => void;
    /**
     * Spacing between pages in dp.
     * @default 0
     */
    pageSpacing?: number;
    /**
     * Padding for pager content (dp or per-side object).
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
};
/**
 * A horizontally scrolling pager that snaps to individual pages,
 * matching Compose's `HorizontalPager`.
 */
export declare function HorizontalPager(props: HorizontalPagerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map