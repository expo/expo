import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier, ViewEvent } from '../../types';
import { getTextFromChildren } from '../../utils';
import { createViewModifierEventListener } from '../modifiers/utils';

export type TextButtonProps = {
  /**
   * The text content to display in the button.
   */
  children?: string | string[] | React.JSX.Element;
  /**
   * The color of the button text.
   */
  color?: ColorValue;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
  /**
   * Callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeTextButtonProps = Omit<TextButtonProps, 'children' | 'onPress'> & {
  text: string;
} & ViewEvent<'onButtonPressed', void>;

const TextButtonNativeView: React.ComponentType<NativeTextButtonProps> = requireNativeView(
  'ExpoUI',
  'TextButtonView'
);

function transformProps(props: TextButtonProps): NativeTextButtonProps {
  const { children, modifiers, onPress, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    text: getTextFromChildren(children) ?? '',
    onButtonPressed: onPress,
  };
}
/**
 * A text button component that displays a clickable text label.
 */
export function TextButton(props: TextButtonProps) {
  return <TextButtonNativeView {...transformProps(props)} />;
}
