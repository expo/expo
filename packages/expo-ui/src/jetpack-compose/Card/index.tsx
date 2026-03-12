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
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeCardProps = CardProps;

const CardNativeView: React.ComponentType<NativeCardProps> = requireNativeView(
  'ExpoUI',
  'CardView'
);

const ElevatedCardNativeView: React.ComponentType<NativeCardProps> = requireNativeView(
  'ExpoUI',
  'ElevatedCardView'
);

const OutlinedCardNativeView: React.ComponentType<NativeCardProps> = requireNativeView(
  'ExpoUI',
  'OutlinedCardView'
);

function transformProps(props: CardProps): NativeCardProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A card component that provides a surface for content.
 */
export function Card(props: CardProps) {
  return <CardNativeView {...transformProps(props)} />;
}

/**
 * An elevated card component that provides a raised surface for content.
 */
export function ElevatedCard(props: CardProps) {
  return <ElevatedCardNativeView {...transformProps(props)} />;
}

/**
 * An outlined card component that provides a bordered surface for content.
 */
export function OutlinedCard(props: CardProps) {
  return <OutlinedCardNativeView {...transformProps(props)} />;
}
