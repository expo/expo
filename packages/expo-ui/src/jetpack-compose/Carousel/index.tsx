import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Per-side padding values in dp for the content.
 */
export type PaddingValuesRecord = {
  start?: number;
  top?: number;
  end?: number;
  bottom?: number;
};

/**
 * Fling behavior type for controlling carousel snapping.
 */
export type FlingBehaviorType = 'singleAdvance' | 'noSnap';

/**
 * Shared props across all carousel components.
 */
export type CarouselCommonConfig = {
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
   * Controls snapping behavior when the user flings the carousel.
   * `'singleAdvance'` snaps to the next item, `'noSnap'` allows free scrolling.
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

function transformProps<T extends { modifiers?: ModifierConfig[] }>(props: T): T {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  } as T;
}

function createCarouselComponent<P extends { modifiers?: ModifierConfig[] }>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<P> = requireNativeView('ExpoUI', viewName);
  return function CarouselComponent(props: P) {
    return <NativeView {...transformProps(props)} />;
  };
}

// region HorizontalCenteredHeroCarousel

export type HorizontalCenteredHeroCarouselProps = CarouselCommonConfig & {
  /**
   * Maximum width of the hero item in dp.
   * When unspecified, the hero item will be as wide as possible.
   */
  maxItemWidth?: number;
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
};

/**
 * A hero carousel that centers one large item between two small peek items,
 * matching Compose's `HorizontalCenteredHeroCarousel`.
 */
export const HorizontalCenteredHeroCarousel =
  createCarouselComponent<HorizontalCenteredHeroCarouselProps>(
    'HorizontalCenteredHeroCarouselView'
  );

// endregion

// region HorizontalMultiBrowseCarousel

export type HorizontalMultiBrowseCarouselProps = CarouselCommonConfig & {
  /**
   * The preferred width of the large item in dp.
   */
  preferredItemWidth: number;
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
};

/**
 * A carousel that shows a large item alongside smaller peek items,
 * matching Compose's `HorizontalMultiBrowseCarousel`.
 */
export const HorizontalMultiBrowseCarousel =
  createCarouselComponent<HorizontalMultiBrowseCarouselProps>('HorizontalMultiBrowseCarouselView');

// endregion

// region HorizontalUncontainedCarousel

export type HorizontalUncontainedCarouselProps = CarouselCommonConfig & {
  /**
   * The width of each item in dp.
   */
  itemWidth: number;
};

/**
 * A carousel where each item has a fixed width with free-form scrolling,
 * matching Compose's `HorizontalUncontainedCarousel`.
 */
export const HorizontalUncontainedCarousel =
  createCarouselComponent<HorizontalUncontainedCarouselProps>('HorizontalUncontainedCarouselView');

// endregion
