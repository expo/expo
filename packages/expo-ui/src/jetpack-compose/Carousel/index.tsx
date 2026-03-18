import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

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

const HorizontalCenteredHeroCarouselNativeView: React.ComponentType<HorizontalCenteredHeroCarouselProps> =
  requireNativeView('ExpoUI', 'HorizontalCenteredHeroCarouselView');

function transformProps(
  props: HorizontalCenteredHeroCarouselProps
): HorizontalCenteredHeroCarouselProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A hero carousel that centers one large item between two small peek items,
 * matching Compose's `HorizontalCenteredHeroCarousel`.
 */
export function HorizontalCenteredHeroCarousel(props: HorizontalCenteredHeroCarouselProps) {
  return <HorizontalCenteredHeroCarouselNativeView {...transformProps(props)} />;
}

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

const HorizontalMultiBrowseCarouselNativeView: React.ComponentType<HorizontalMultiBrowseCarouselProps> =
  requireNativeView('ExpoUI', 'HorizontalMultiBrowseCarouselView');

function transformMultiBrowseProps(
  props: HorizontalMultiBrowseCarouselProps
): HorizontalMultiBrowseCarouselProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A carousel that shows a large item alongside smaller peek items,
 * matching Compose's `HorizontalMultiBrowseCarousel`.
 */
export function HorizontalMultiBrowseCarousel(props: HorizontalMultiBrowseCarouselProps) {
  return <HorizontalMultiBrowseCarouselNativeView {...transformMultiBrowseProps(props)} />;
}
