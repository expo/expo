import { requireNativeView } from 'expo';
import { useCallback } from 'react';
import { NativeSyntheticEvent, processColor, StyleProp, ViewStyle } from 'react-native';

import { Host } from '../Host';

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
};

type OnValueChangedEvent = NativeSyntheticEvent<{ value: string }>;

const ColorPickerNativeView: React.ComponentType<
  Omit<ColorPickerProps, 'selection' | 'onValueChanged'> & {
    selection: ReturnType<typeof processColor>;
    onValueChanged: (event: OnValueChangedEvent) => void;
  }
> = requireNativeView('ExpoUI', 'ColorPickerView');

/**
 * `<ColorPicker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ColorPickerPrimitive({
  selection,
  onValueChanged,
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
      selection={processColor(selection || '')}
      onValueChanged={onNativeValueChanged}
      {...restProps}
    />
  );
}

/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker(props: ColorPickerProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <ColorPickerPrimitive {...props} />
    </Host>
  );
}
