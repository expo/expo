import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { type ShapeJSXElement, type ShapeRecordProps, parseJSXShape } from '../Shape';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for button elements.
 */
export type ButtonColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  disabledContainerColor?: ColorValue;
  disabledContentColor?: ColorValue;
};

/**
 * Content padding for the button's inner content.
 * All values are in density-independent pixels (dp).
 */
export type ButtonContentPadding = {
  start?: number;
  top?: number;
  end?: number;
  bottom?: number;
};

export type ButtonProps = {
  /**
   * Callback that is called when the button is clicked.
   */
  onClick?: () => void;
  /**
   * Whether the button is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for button elements.
   */
  colors?: ButtonColors;
  /**
   * The padding between the button container and its content.
   * Use this to adjust internal spacing, for example when adding a leading icon
   */
  contentPadding?: ButtonContentPadding;
  /**
   * The shape of the button.
   */
  shape?: ShapeJSXElement;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Content to display inside the button.
   */
  children: React.ReactNode;
};

type NativeButtonProps = Omit<ButtonProps, 'onClick' | 'shape' | 'children'> & {
  shape?: ShapeRecordProps;
  children?: React.ReactNode;
} & ViewEvent<'onButtonPressed', void>;

/**
 * @hidden
 */
export function transformButtonProps(props: Omit<ButtonProps, 'children'>): NativeButtonProps {
  const { onClick, shape, modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    enabled: props.enabled ?? true,
    shape: parseJSXShape(shape),
    onButtonPressed: onClick ? () => onClick() : undefined,
  };
}

function createButtonComponent(name: string) {
  const NativeView: React.ComponentType<NativeButtonProps> = requireNativeView('ExpoUI', name);

  function Component(props: ButtonProps) {
    const { children, ...restProps } = props;
    return <NativeView {...transformButtonProps(restProps)}>{children}</NativeView>;
  }
  Component.displayName = name;
  return Component;
}

/**
 * A filled button component.
 */
export const Button = createButtonComponent('Button');

/**
 * A filled tonal button component.
 */
export const FilledTonalButton = createButtonComponent('FilledTonalButton');

/**
 * An outlined button component.
 */
export const OutlinedButton = createButtonComponent('OutlinedButton');

/**
 * An elevated button component.
 */
export const ElevatedButton = createButtonComponent('ElevatedButton');

/**
 * A text button component.
 */
export const TextButton = createButtonComponent('TextButton');
