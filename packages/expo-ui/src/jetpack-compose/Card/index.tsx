import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for card's core elements.
 */
export type CardColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
};

/**
 * Border configuration for cards.
 */
export type CardBorder = {
  /**
   * Border width in dp.
   * @default 1
   */
  width?: number;
  /**
   * Border color.
   */
  color?: ColorValue;
};

function transformProps<T extends { modifiers?: ModifierConfig[] }>(props: T): T {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  } as T;
}

// region Card

export type CardProps = {
  /**
   * The content to display inside the card.
   */
  children?: React.ReactNode;
  /**
   * Colors for card's core elements.
   */
  colors?: CardColors;
  /**
   * Default elevation in dp.
   */
  elevation?: number;
  /**
   * Border configuration for the card.
   */
  border?: CardBorder;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeCardProps = CardProps;

const CardNativeView: React.ComponentType<NativeCardProps> = requireNativeView(
  'ExpoUI',
  'CardView'
);

/**
 * A card component that renders a filled card surface for content.
 */
export function Card(props: CardProps) {
  return <CardNativeView {...transformProps(props)} />;
}

// endregion

// region ElevatedCard

export type ElevatedCardProps = {
  /**
   * The content to display inside the card.
   */
  children?: React.ReactNode;
  /**
   * Colors for card's core elements.
   */
  colors?: CardColors;
  /**
   * Default elevation in dp. Material 3 default is 1dp.
   */
  elevation?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeElevatedCardProps = ElevatedCardProps;

const ElevatedCardNativeView: React.ComponentType<NativeElevatedCardProps> = requireNativeView(
  'ExpoUI',
  'ElevatedCardView'
);

/**
 * An elevated card component that provides a raised surface for content.
 */
export function ElevatedCard(props: ElevatedCardProps) {
  return <ElevatedCardNativeView {...transformProps(props)} />;
}

// endregion

// region OutlinedCard

export type OutlinedCardProps = {
  /**
   * The content to display inside the card.
   */
  children?: React.ReactNode;
  /**
   * Colors for card's core elements.
   */
  colors?: CardColors;
  /**
   * Default elevation in dp.
   */
  elevation?: number;
  /**
   * Border configuration for the outlined card.
   */
  border?: CardBorder;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeOutlinedCardProps = OutlinedCardProps;

const OutlinedCardNativeView: React.ComponentType<NativeOutlinedCardProps> = requireNativeView(
  'ExpoUI',
  'OutlinedCardView'
);

/**
 * An outlined card component that provides a bordered surface for content.
 */
export function OutlinedCard(props: OutlinedCardProps) {
  return <OutlinedCardNativeView {...transformProps(props)} />;
}

// endregion
