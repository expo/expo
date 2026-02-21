import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for card's core elements.
 */
export type CardElementColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
};

export type CardProps = {
  /**
   * The content to display inside the card.
   */
  children?: React.ReactNode;
  /**
   * The variant of the card.
   * - 'default' - A filled card with no outline.
   * - 'elevated' - A filled card with elevation/shadow.
   * - 'outlined' - A card with an outline border.
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'outlined';
  /**
   * The background color of the card.
   */
  color?: ColorValue;
  /**
   * Colors for card's core elements.
   */
  elementColors?: CardElementColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeCardProps = CardProps;
const CardNativeView: React.ComponentType<NativeCardProps> = requireNativeView(
  'ExpoUI',
  'CardView'
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
