import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';

export type PaddingValuesRecord = {
  start?: number;
  top?: number;
  end?: number;
  bottom?: number;
};

export type CarouselVariant = 'multiBrowse' | 'unconstrained';
export type FlingBehaviorType = 'singleAdvance' | 'noSnap';

export type CarouselProps = {
  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
  /** Carousel variant */
  variant?: CarouselVariant;
  /** Spacing between items (dp) */
  itemSpacing?: number;
  /** Padding for carousel content (dp or object) */
  contentPadding?: number | PaddingValuesRecord;
  /** Minimum small item width (dp) */
  minSmallItemWidth?: number;
  /** Maximum small item width (dp) */
  maxSmallItemWidth?: number;
  /** Fling behavior type */
  flingBehavior?: FlingBehaviorType;
  /** Preferred item width (dp) for multiBrowse variant */
  preferredItemWidth?: number;
  /** Item width (dp) for unconstrained variant */
  itemWidth?: number;
  /** Children to render */
  children: React.ReactNode;
};

type NativeCarouselProps = CarouselProps;

const CarouselNativeView: React.ComponentType<NativeCarouselProps> = requireNativeView(
  'ExpoUI',
  'CarouselView'
);

export function transformCarouselProps(props: CarouselProps): NativeCarouselProps {
  return {
    ...props,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  } as NativeCarouselProps;
}

export function Carousel(props: CarouselProps) {
  return <CarouselNativeView {...transformCarouselProps(props)} />;
}
