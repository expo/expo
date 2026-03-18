import { type ModifierConfig } from '../../types';
export type PaddingValuesRecord = {
    start?: number;
    top?: number;
    end?: number;
    bottom?: number;
};
export type FlingBehaviorType = 'singleAdvance' | 'noSnap';
export type HorizontalCenteredHeroCarouselProps = {
    /**
     * Maximum width of the hero item in dp.
     * When unspecified, the hero item will be as wide as possible.
     */
    maxItemWidth?: number;
    /**
     * Spacing between items in dp.
     * @default 0
     */
    itemSpacing?: number;
    /**
     * Padding for carousel content (dp or object).
     */
    contentPadding?: number | PaddingValuesRecord;
    /**
     * Minimum width of small peek items in dp.
     * @default CarouselDefaults.MinSmallItemSize
     */
    minSmallItemWidth?: number;
    /**
     * Maximum width of small peek items in dp.
     * @default CarouselDefaults.MaxSmallItemSize
     */
    maxSmallItemWidth?: number;
    /**
     * Fling behavior type.
     * @default 'singleAdvance'
     */
    flingBehavior?: FlingBehaviorType;
    /**
     * Whether the user can scroll the carousel.
     * @default true
     */
    userScrollEnabled?: boolean;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children to render as carousel items.
     */
    children: React.ReactNode;
};
/**
 * A hero carousel that centers one large item between two small peek items,
 * matching Compose's `HorizontalCenteredHeroCarousel`.
 */
export declare function HorizontalCenteredHeroCarousel(props: HorizontalCenteredHeroCarouselProps): import("react").JSX.Element;
export type HorizontalMultiBrowseCarouselProps = {
    /**
     * The preferred width of the large item in dp.
     */
    preferredItemWidth: number;
    /**
     * Spacing between items in dp.
     * @default 0
     */
    itemSpacing?: number;
    /**
     * Padding for carousel content (dp or object).
     */
    contentPadding?: number | PaddingValuesRecord;
    /**
     * Minimum width of small peek items in dp.
     * @default CarouselDefaults.MinSmallItemSize
     */
    minSmallItemWidth?: number;
    /**
     * Maximum width of small peek items in dp.
     * @default CarouselDefaults.MaxSmallItemSize
     */
    maxSmallItemWidth?: number;
    /**
     * Fling behavior type.
     * @default 'singleAdvance'
     */
    flingBehavior?: FlingBehaviorType;
    /**
     * Whether the user can scroll the carousel.
     * @default true
     */
    userScrollEnabled?: boolean;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children to render as carousel items.
     */
    children: React.ReactNode;
};
/**
 * A carousel that shows a large item alongside smaller peek items,
 * matching Compose's `HorizontalMultiBrowseCarousel`.
 */
export declare function HorizontalMultiBrowseCarousel(props: HorizontalMultiBrowseCarouselProps): import("react").JSX.Element;
export type HorizontalUncontainedCarouselProps = {
    /**
     * The width of each item in dp.
     */
    itemWidth: number;
    /**
     * Spacing between items in dp.
     * @default 0
     */
    itemSpacing?: number;
    /**
     * Padding for carousel content (dp or object).
     */
    contentPadding?: number | PaddingValuesRecord;
    /**
     * Fling behavior type.
     * @default 'noSnap'
     */
    flingBehavior?: FlingBehaviorType;
    /**
     * Whether the user can scroll the carousel.
     * @default true
     */
    userScrollEnabled?: boolean;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children to render as carousel items.
     */
    children: React.ReactNode;
};
/**
 * A carousel where each item has a fixed width with free-form scrolling,
 * matching Compose's `HorizontalUncontainedCarousel`.
 */
export declare function HorizontalUncontainedCarousel(props: HorizontalUncontainedCarouselProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map