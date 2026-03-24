import { requireNativeView } from 'expo';
import { ReactNode } from 'react';
import { type ColorValue, NativeSyntheticEvent } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

const NativeView: React.ComponentType<NativeExposedDropdownMenuPickerProps> = requireNativeView(
  'ExpoUI',
  'ExposedDropdownMenuPickerView'
);

const SlotNativeView: React.ComponentType<{
  slotName: string;
  children: React.ReactNode;
}> = requireNativeView('ExpoUI', 'SlotView');

/**
 * Color overrides for the `ExposedDropdownMenuPicker`.
 */
export type ExposedDropdownMenuPickerColors = {
  /** Text color when the text field is focused. */
  focusedTextColor?: ColorValue;
  /** Text color when the text field is unfocused. */
  unfocusedTextColor?: ColorValue;
  /** Text color when the picker is disabled. */
  disabledTextColor?: ColorValue;
  /** Background color when the text field is focused. */
  focusedContainerColor?: ColorValue;
  /** Background color when the text field is unfocused. */
  unfocusedContainerColor?: ColorValue;
  /** Background color when the picker is disabled. */
  disabledContainerColor?: ColorValue;
  /** Indicator (underline) color when focused. */
  focusedIndicatorColor?: ColorValue;
  /** Indicator (underline) color when unfocused. */
  unfocusedIndicatorColor?: ColorValue;
  /** Indicator (underline) color when disabled. */
  disabledIndicatorColor?: ColorValue;
  /** Trailing icon (dropdown arrow) color when focused. */
  focusedTrailingIconColor?: ColorValue;
  /** Trailing icon (dropdown arrow) color when unfocused. */
  unfocusedTrailingIconColor?: ColorValue;
  /** Trailing icon (dropdown arrow) color when disabled. */
  disabledTrailingIconColor?: ColorValue;
  /** Background color of the dropdown menu. */
  menuContainerColor?: ColorValue;
};

export type ExposedDropdownMenuPickerProps = {
  /**
   * The text displayed in the text field (typically the selected item's label).
   */
  value: string;
  /**
   * Whether the dropdown menu is expanded (visible).
   */
  expanded?: boolean;
  /**
   * Whether the picker is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback when the expanded state changes (for example, tapping the field or dismissing the menu).
   */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Color overrides for the text field and dropdown menu.
   */
  colors?: ExposedDropdownMenuPickerColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children — should contain `ExposedDropdownMenuPicker.Items` with `DropdownMenuItem` children.
   */
  children?: ReactNode;
};

type NativeExposedDropdownMenuPickerProps = Omit<
  ExposedDropdownMenuPickerProps,
  'onExpandedChange' | 'children'
> & {
  onExpandedChange?: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
  children?: ReactNode;
};

/**
 * Container for items displayed in the dropdown menu.
 * Children should be `DropdownMenuItem` components.
 */
function Items(props: { children: ReactNode }) {
  return <SlotNativeView slotName="items">{props.children}</SlotNativeView>;
}

/**
 * A Material 3 `ExposedDropdownMenuBox`.
 * Renders a read-only text field that expands into a dropdown menu.
 *
 * Use `ExposedDropdownMenuPicker.Items` to wrap `DropdownMenuItem` children.
 */
function ExposedDropdownMenuPickerComponent(props: ExposedDropdownMenuPickerProps) {
  const { modifiers, onExpandedChange, children, ...restProps } = props;
  return (
    <NativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onExpandedChange={
        onExpandedChange ? ({ nativeEvent: { value } }) => onExpandedChange(value) : undefined
      }>
      {children}
    </NativeView>
  );
}

export const ExposedDropdownMenuPicker = Object.assign(ExposedDropdownMenuPickerComponent, {
  Items,
});
