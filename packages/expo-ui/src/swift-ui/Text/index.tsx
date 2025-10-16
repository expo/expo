import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import { getTextFromChildren } from '../../utils';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface TextProps extends CommonViewModifierProps {
  /**
   * The children of the text.
   * Only string and number are supported.
   */
  children?: React.ReactNode;
  /**
   * The font weight of the text.
   * Maps to iOS system font weights.
   */
  weight?:
    | 'ultraLight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
  /**
   * The font design of the text.
   * Maps to iOS system font designs.
   */
  design?: 'default' | 'rounded' | 'serif' | 'monospaced';
  /**
   * The font size of the text.
   */
  size?: number;
  /**
   * The line limit of the text.
   */
  lineLimit?: number;
  /**
   * The color of the text.
   */
  color?: ColorValue;
}

type NativeTextProps = Omit<TextProps, 'children'> & {
  text: string;
};

const TextNativeView: React.ComponentType<Omit<TextProps, 'children'> & { text: string }> =
  requireNativeView('ExpoUI', 'TextView');

function transformTextProps(props: TextProps): NativeTextProps {
  const { children, modifiers, ...restProps } = props;
  const text = getTextFromChildren(children);
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    text: text ?? '',
  };
}

export function Text(props: TextProps) {
  return <TextNativeView {...transformTextProps(props)} />;
}
