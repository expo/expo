import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
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
  children: React.ReactNode;
};

type NativeIconButtonProps = Omit<IconButtonProps, 'onClick' | 'shape' | 'children'> & {
  shape?: ShapeRecordProps;
  children?: React.ReactNode;
} & ViewEvent<'onButtonPressed', void>;

function createIconButtonComponent(name: string) {
  const NativeView: React.ComponentType<NativeIconButtonProps> = requireNativeView('ExpoUI', name);

  function Component(props: IconButtonProps) {
    const { children, ...restProps } = props;
    return <NativeView {...transformButtonProps(restProps)}>{children}</NativeView>;
  }
  Component.displayName = name;
  return Component;
}

/**
 * A standard icon button with no background.
 */
export const IconButton = createIconButtonComponent('IconButton');

/**
 * A filled icon button with a solid background.
 */
export const FilledIconButton = createIconButtonComponent('FilledIconButton');

/**
 * A filled tonal icon button with a muted background.
 */
export const FilledTonalIconButton = createIconButtonComponent('FilledTonalIconButton');

/**
 * An outlined icon button with a border and no fill.
 */
export const OutlinedIconButton = createIconButtonComponent('OutlinedIconButton');
