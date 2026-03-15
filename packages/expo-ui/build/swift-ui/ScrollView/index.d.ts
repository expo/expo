import { type UnitPointValue } from '../modifiers/index';
import { type CommonViewModifierProps } from '../types';
export type ScrollViewProps = {
    children: React.ReactNode;
    /**
     * The scrollable axes.
     * @default 'vertical'
     */
    axes?: 'vertical' | 'horizontal' | 'both';
    /**
     * Whether to show scroll indicators.
     * @default true
     */
    showsIndicators?: boolean;
    /**
     * Anchor point for scroll position tracking. Influences which view updates the position
     * and controls alignment when programmatically scrolling.
     * @platform ios 17.0+
     */
    scrollPositionAnchor?: UnitPointValue | null;
    /**
     * Scroll to a view with the given `id()` modifier value.
     * Requires `scrollTargetLayout` on the content container.
     * @platform ios 17.0+
     */
    scrollToID?: string | null;
    /**
     * Scroll to an edge: `'top'`, `'bottom'`, `'leading'`, or `'trailing'`.
     * @platform ios 18.0+
     */
    scrollToEdge?: 'top' | 'bottom' | 'leading' | 'trailing' | null;
    /**
     * Scroll to a point. Pass `[x, y]` coordinates.
     * @platform ios 18.0+
     */
    scrollToPoint?: [number, number] | null;
    /**
     * Called when the scroll position changes.
     * Requires children to have `id()` modifiers and the content container to have `scrollTargetLayout`.
     * On iOS 17+, reports `viewID`. On iOS 18+, also includes `isPositionedByUser`, `edge`, `point`, `x`, `y`.
     * @platform ios 17.0+
     */
    onScrollPositionChange?: (event: ScrollPositionChangeEvent) => void;
} & CommonViewModifierProps;
export type ScrollPositionChangeEvent = {
    /** The ID of the top-most visible view (from `id()` modifier). */
    viewID?: string;
    /** Whether the user scrolled manually (iOS 18+ only). */
    isPositionedByUser?: boolean;
    /** The edge the scroll view is positioned at (iOS 18+ only). */
    edge?: 'top' | 'bottom' | 'leading' | 'trailing';
    /** The scroll offset point (iOS 18+ only). */
    point?: {
        x: number;
        y: number;
    };
    /** The x scroll offset (iOS 26+ only). */
    x?: number;
    /** The y scroll offset (iOS 26+ only). */
    y?: number;
};
export declare function ScrollView(props: ScrollViewProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map