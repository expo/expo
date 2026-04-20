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

function createCardComponent<P extends { modifiers?: ModifierConfig[] }>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<P> = requireNativeView('ExpoUI', viewName);
  function Component(props: P) {
    return <NativeView {...transformProps(props)} />;
  }
  Component.displayName = viewName;
  return Component;
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

/**
 * A card component that renders a filled card surface for content.
 */
export const Card = createCardComponent<CardProps>('CardView');

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

/**
 * An elevated card component that provides a raised surface for content.
 */
export const ElevatedCard = createCardComponent<ElevatedCardProps>('ElevatedCardView');

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

/**
 * An outlined card component that provides a bordered surface for content.
 */
export const OutlinedCard = createCardComponent<OutlinedCardProps>('OutlinedCardView');

// endregion
