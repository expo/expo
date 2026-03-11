import { requireNativeView } from 'expo';
import { type ModifierConfig, ViewEvent } from '../../types';
import { type ColorValue } from 'react-native';

import { transformButtonProps } from '../Button';
import { type ShapeJSXElement, type ShapeRecordProps } from '../Shape';

/**
 * Colors for icon button elements.
 */
export type IconButtonColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  disabledContainerColor?: ColorValue;
  disabledContentColor?: ColorValue;
};

export type IconButtonProps = {
  /**
   * Callback that is called when the icon button is clicked.
   */
  onClick?: () => void;
  /**
   * Whether the icon button is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for icon button elements.
   * @platform android
   */
  colors?: IconButtonColors;
  /**
   * The shape of the icon button.
   */
  shape?: ShapeJSXElement;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Content to display inside the icon button.
   */
  children?: React.ReactNode;
};

type NativeIconButtonProps = Omit<IconButtonProps, 'onClick' | 'shape' | 'children'> & {
  shape?: ShapeRecordProps;
  children?: React.ReactNode;
} & ViewEvent<'onButtonPressed', void>;

const IconButtonNativeView: React.ComponentType<NativeIconButtonProps> = requireNativeView(
  'ExpoUI',
  'IconButton'
);

const FilledIconButtonNativeView: React.ComponentType<NativeIconButtonProps> = requireNativeView(
  'ExpoUI',
  'FilledIconButton'
);

const FilledTonalIconButtonNativeView: React.ComponentType<NativeIconButtonProps> =
  requireNativeView('ExpoUI', 'FilledTonalIconButton');

const OutlinedIconButtonNativeView: React.ComponentType<NativeIconButtonProps> = requireNativeView(
  'ExpoUI',
  'OutlinedIconButton'
);

/**
 * A standard icon button with no background.
 */
export function IconButton(props: IconButtonProps) {
  const { children, ...restProps } = props;
  return (
    <IconButtonNativeView {...transformButtonProps(restProps)}>{children}</IconButtonNativeView>
  );
}

/**
 * A filled icon button with a solid background.
 */
export function FilledIconButton(props: IconButtonProps) {
  const { children, ...restProps } = props;
  return (
    <FilledIconButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </FilledIconButtonNativeView>
  );
}

/**
 * A filled tonal icon button with a muted background.
 */
export function FilledTonalIconButton(props: IconButtonProps) {
  const { children, ...restProps } = props;
  return (
    <FilledTonalIconButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </FilledTonalIconButtonNativeView>
  );
}

/**
 * An outlined icon button with a border and no fill.
 */
export function OutlinedIconButton(props: IconButtonProps) {
  const { children, ...restProps } = props;
  return (
    <OutlinedIconButtonNativeView {...transformButtonProps(restProps)}>
      {children}
    </OutlinedIconButtonNativeView>
  );
}
