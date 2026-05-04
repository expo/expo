import { requireNativeView } from 'expo';
import type { NativeSyntheticEvent, ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for checkbox core elements.
 */
export type CheckboxColors = {
  checkedColor?: ColorValue;
  disabledCheckedColor?: ColorValue;
  uncheckedColor?: ColorValue;
  disabledUncheckedColor?: ColorValue;
  checkmarkColor?: ColorValue;
  disabledIndeterminateColor?: ColorValue;
};

export type CheckboxProps = {
  /**
   * Indicates whether the checkbox is checked.
   */
  value: boolean;
  /**
   * Whether the checkbox is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback function that is called when the checked state changes.
   */
  onCheckedChange?: (value: boolean) => void;
  /**
   * Colors for checkbox core elements.
   */
  colors?: CheckboxColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeCheckboxProps = Omit<CheckboxProps, 'onCheckedChange'> & {
  nativeClickable: boolean;
  onCheckedChange: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
};

const CheckboxNativeView: React.ComponentType<NativeCheckboxProps> = requireNativeView(
  'ExpoUI',
  'CheckboxView'
);

function transformCheckboxProps(props: CheckboxProps): NativeCheckboxProps {
  const { modifiers, onCheckedChange, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    nativeClickable: onCheckedChange != null,
    onCheckedChange: ({ nativeEvent: { value } }) => {
      onCheckedChange?.(value);
    },
  };
}

/**
 * A checkbox component.
 */
export function Checkbox(props: CheckboxProps) {
  return <CheckboxNativeView {...transformCheckboxProps(props)} />;
}

/**
 * The toggleable state of a tri-state checkbox.
 */
export type ToggleableState = 'on' | 'off' | 'indeterminate';

export type TriStateCheckboxProps = {
  /**
   * The toggleable state of the checkbox: `'on'`, `'off'`, or `'indeterminate'`.
   */
  state: ToggleableState;
  /**
   * Whether the checkbox is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback function that is called when the checkbox is clicked.
   */
  onClick?: () => void;
  /**
   * Colors for checkbox core elements.
   */
  colors?: CheckboxColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeTriStateCheckboxProps = Omit<TriStateCheckboxProps, 'onClick'> & {
  nativeClickable: boolean;
} & ViewEvent<'onNativeClick', void>;

const TriStateCheckboxNativeView: React.ComponentType<NativeTriStateCheckboxProps> =
  requireNativeView('ExpoUI', 'TriStateCheckboxView');

function transformTriStateCheckboxProps(props: TriStateCheckboxProps): NativeTriStateCheckboxProps {
  const { modifiers, onClick, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    nativeClickable: onClick != null,
    onNativeClick: onClick ? () => onClick() : undefined,
  };
}

/**
 * A tri-state checkbox component that supports `'on'`, `'off'`, and `'indeterminate'` states.
 * Useful for "select all" patterns where the parent checkbox reflects the state of its children.
 */
export function TriStateCheckbox(props: TriStateCheckboxProps) {
  return <TriStateCheckboxNativeView {...transformTriStateCheckboxProps(props)} />;
}
