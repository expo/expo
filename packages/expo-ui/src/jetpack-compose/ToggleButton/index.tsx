import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { ExpoUIModule } from '../ExpoUIModule';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for toggle button elements.
 */
export type ToggleButtonColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  checkedContainerColor?: ColorValue;
  checkedContentColor?: ColorValue;
  disabledContainerColor?: ColorValue;
  disabledContentColor?: ColorValue;
};

export type ToggleButtonProps = {
  /**
   * Whether the toggle button is checked.
   */
  checked: boolean;
  /**
   * Callback that is called when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Whether the button is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for toggle button elements.
   */
  colors?: ToggleButtonColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Content to display inside the toggle button.
   */
  children: React.ReactNode;
};

type NativeToggleButtonProps = Omit<ToggleButtonProps, 'onCheckedChange' | 'children'> & {
  children?: React.ReactNode;
} & ViewEvent<'onCheckedChange', { checked: boolean }>;

/**
 * @hidden
 */
export function transformToggleButtonProps(
  props: Omit<ToggleButtonProps, 'children'>
): NativeToggleButtonProps {
  const { onCheckedChange, modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    enabled: props.enabled ?? true,
    onCheckedChange: onCheckedChange
      ? ({ nativeEvent: { checked } }) => onCheckedChange(checked)
      : undefined,
  };
}

function createToggleButtonComponent(name: string) {
  const NativeView: React.ComponentType<NativeToggleButtonProps> = requireNativeView(
    'ExpoUI',
    name
  );

  function Component(props: ToggleButtonProps) {
    const { children, ...restProps } = props;
    return <NativeView {...transformToggleButtonProps(restProps)}>{children}</NativeView>;
  }
  Component.displayName = name;
  return Component;
}

/**
 * A toggle button component that can be toggled on and off.
 */
const ToggleButton = Object.assign(createToggleButtonComponent('ToggleButton'), {
  DefaultIconSpacing: ExpoUIModule.ToggleButtonIconSpacing as number,
  DefaultIconSize: ExpoUIModule.ToggleButtonIconSize as number,
});

/**
 * An icon toggle button with no background.
 */
const IconToggleButton = createToggleButtonComponent('IconToggleButton');

/**
 * A filled icon toggle button with a solid background.
 */
const FilledIconToggleButton = createToggleButtonComponent('FilledIconToggleButton');

/**
 * An outlined icon toggle button with a border and no fill.
 */
const OutlinedIconToggleButton = createToggleButtonComponent('OutlinedIconToggleButton');

export { ToggleButton, IconToggleButton, FilledIconToggleButton, OutlinedIconToggleButton };
