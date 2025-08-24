import { requireNativeView } from 'expo';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type CarouselTextStyle =
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall';

export type CarouselVariant = 'multiBrowse' | 'uncontained';

export interface CarouselItem {
  image: string;
  title: string;
}

export interface CarouselProps {
  /**
   * The items to display in the carousel
   */
  items: CarouselItem[];

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
   * Item height in dp for carousel items
   * Default: 200
   */
  itemHeight?: number;

  /**
   * Spacing between items in dp
   * Default: 8
   */
  itemSpacing?: number;

  /**
   * Horizontal content padding in dp
   * Default: 16
   */
  contentPadding?: number;

  /**
   * Top/bottom padding in dp
   * Default: 8
   */
  topBottomPadding?: number;

  /**
   * Corner radius in dp
   * Default: 28
   */
  cornerRadius?: number;

  /**
   * Starting item index
   * Default: 0
   */
  initialItemIndex?: number;

  /**
   * Text color in hex format (e.g., "#FFFFFF", "#000000")
   * Default: "#FFFFFF" (white)
   */
  textColor?: string;

  /**
   * Text style for item titles
   * Default: "titleMedium"
   */
  textStyle?: CarouselTextStyle;

  /**
   * Additional styles to apply to the carousel.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Callback function called when an item is pressed
   * @param event The event object containing the index of the pressed item
   */
  onItemPress?: (event: { nativeEvent: { index: number } }) => void;
}

const CarouselViewNative: React.ComponentType<CarouselProps> = requireNativeView(
  'ExpoUI',
  'CarouselView'
);

export function Carousel(props: CarouselProps) {
  return <CarouselViewNative {...props} />;
}
