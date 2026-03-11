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
  onSelectionChange?: (value: string) => void;
  /**
   * Whether the color picker should support opacity.
   */
  supportsOpacity?: boolean;
} & CommonViewModifierProps;

type onSelectionChangeEvent = NativeSyntheticEvent<{ value: string }>;

const ColorPickerNativeView: React.ComponentType<
  Omit<ColorPickerProps, 'selection' | 'onSelectionChange'> & {
    selection: ReturnType<typeof processColor>;
    onSelectionChange: (event: onSelectionChangeEvent) => void;
  }
> = requireNativeView('ExpoUI', 'ColorPickerView');

/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker({
  selection,
  onSelectionChange,
  modifiers,
  ...restProps
}: ColorPickerProps) {
  const onNativeValueChanged = useCallback(
    (event: onSelectionChangeEvent) => {
      onSelectionChange?.(event.nativeEvent.value);
    },
    [onSelectionChange]
  );
  return (
    <ColorPickerNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      selection={processColor(selection || '')}
      onSelectionChange={onNativeValueChanged}
      {...restProps}
    />
  );
}
