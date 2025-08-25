import { requireNativeView } from 'expo';
import React, { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { transformCarouselProps, CarouselElement } from './utils';
import { ExpoModifier } from '../../types';

export type CarouselTextStyle =
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall';

export type CarouselVariant = 'multiBrowse' | 'uncontained';

export interface CarouselItemProps {
  /**
   * The image URL to display in the carousel item
   */
  image: string;

  /**
   * The title text to display over the image
   */
  title: string;

  /**
   * Text color in hex format (e.g., "#FFFFFF", "#000000")
   * Default: "#FFFFFF" (white)
   */
  textColor?: string;

  /**
   * Text style for item title
   * Default: "titleMedium"
   */
  textStyle?: CarouselTextStyle;

  /**
   * Corner radius in dp
   * Default: 28
   */
  cornerRadius?: number;

  /**
   * Item height in dp
   * Default: 200
   */
  height?: number;

  /**
   * Callback function called when this item is pressed
   * @param index The index of the pressed item
   */
  onPress?: (index: number) => void;
}

export interface CarouselProps {
  /**
   * The carousel variant to use
   */
  variant?: CarouselVariant;

  /**
   * Preferred item width in dp for Multi Browse carousel
   * Default: 200
   */
  preferredItemWidth?: number;

  /**
   * Spacing between items in dp
   * Default: 8
   */
  itemSpacing?: number;

  /**
   * Horizontal content padding in dp
   * Default: 0
   */
  contentPadding?: number;

  /**
   * Starting item index
   * Default: 0
   */
  initialItemIndex?: number;

  /**
   * Additional styles to apply to the carousel.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Modifiers for customizing the carousel
   */
  modifiers?: ExpoModifier[];

  /**
   * The carousel items as children
   */
  children: ReactElement<CarouselItemProps> | ReactElement<CarouselItemProps>[];
}

export type NativeCarouselProps = Omit<CarouselProps, 'children'> & {
  elements: CarouselElement[];
  onItemPress?: (event: { nativeEvent: { index: number } }) => void;
};

const CarouselViewNative: React.ComponentType<NativeCarouselProps> = requireNativeView(
  'ExpoUI',
  'CarouselView'
);

/**
 * Individual carousel item component
 */
export function CarouselItem(props: CarouselItemProps): React.JSX.Element {
  // This component is used for type checking and transformation
  // The actual rendering happens on the native side
  return React.createElement('CarouselItem', props);
}

export function Carousel(props: CarouselProps) {
  return <CarouselViewNative {...transformCarouselProps(props)} />;
}
