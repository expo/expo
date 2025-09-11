import { requireNativeView } from 'expo';
import { useCallback } from 'react';
import { NativeSyntheticEvent, processColor } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type ColorPickerProps = {
  /**
   * The currently selected color in the format `#RRGGBB` or `#RRGGBBAA`.
   */
  selection: string | null;
  /**
   * A label displayed on the `ColorPicker`.
   */
  label?: string;
  /**
   * Callback function that is called when a new color is selected.
   */
  onValueChanged?: (value: string) => void;
  /**
   * Whether the color picker should support opacity.
   */
  supportsOpacity?: boolean;
} & CommonViewModifierProps;

type OnValueChangedEvent = NativeSyntheticEvent<{ value: string }>;

const ColorPickerNativeView: React.ComponentType<
  Omit<ColorPickerProps, 'selection' | 'onValueChanged'> & {
    selection: ReturnType<typeof processColor>;
    onValueChanged: (event: OnValueChangedEvent) => void;
  }
> = requireNativeView('ExpoUI', 'ColorPickerView');

/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker({
  selection,
  onValueChanged,
  modifiers,
  ...restProps
}: ColorPickerProps) {
  const onNativeValueChanged = useCallback(
    (event: OnValueChangedEvent) => {
      onValueChanged?.(event.nativeEvent.value);
    },
    [onValueChanged]
  );
  return (
    <ColorPickerNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      selection={processColor(selection || '')}
      onValueChanged={onNativeValueChanged}
      {...restProps}
    />
  );
}
