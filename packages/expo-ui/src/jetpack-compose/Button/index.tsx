import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig, ViewEvent } from '../../types';
import { ShapeJSXElement, ShapeRecordProps, parseJSXShape } from '../Shape';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for button elements.
 * @platform android
 */
export type ButtonColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  disabledContainerColor?: ColorValue;
  disabledContentColor?: ColorValue;
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
   * @platform android
   */
  colors?: ButtonColors;
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
  children?: React.ReactNode;
};

type NativeButtonProps = Omit<ButtonProps, 'onClick' | 'shape' | 'children'> & {
  shape?: ShapeRecordProps;
  children?: React.ReactNode;
} & ViewEvent<'onButtonPressed', void>;

const ButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'Button'
);

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

const FilledTonalButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'FilledTonalButton'
);

const OutlinedButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'OutlinedButton'
);

const ElevatedButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'ElevatedButton'
);

const TextButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'TextButton'
);

/**
 * A filled button component.
 * @platform android
 */
export function Button(props: ButtonProps) {
  const { children, ...restProps } = props;
  return <ButtonNativeView {...transformButtonProps(restProps)}>{children}</ButtonNativeView>;
}

/**
 * A filled tonal button component.
 * @platform android
 */
export function FilledTonalButton(props: ButtonProps) {
  const { children, ...restProps } = props;
  return (
    <FilledTonalButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </FilledTonalButtonNativeView>
  );
}

/**
 * An outlined button component.
 * @platform android
 */
export function OutlinedButton(props: ButtonProps) {
  const { children, ...restProps } = props;
  return (
    <OutlinedButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </OutlinedButtonNativeView>
  );
}

/**
 * An elevated button component.
 * @platform android
 */
export function ElevatedButton(props: ButtonProps) {
  const { children, ...restProps } = props;
  return (
    <ElevatedButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </ElevatedButtonNativeView>
  );
}

/**
 * A text button component.
 * @platform android
 */
export function TextButton(props: ButtonProps) {
  const { children, ...restProps } = props;
  return (
    <TextButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </TextButtonNativeView>
  );
}
