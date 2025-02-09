import { requireNativeView } from 'expo';
import { processColor, StyleProp, ViewStyle } from 'react-native';

/**
 * Props for the ColorPicker component.
 */
export type ColorPickerProps = {
  /**
   * The currently selected color in the format `#RRGGBB` or `#RRGGBBAA`.
   */
  selection: string | null;
  /**
   * A label displayed on the ColorPicker.
   */
  label?: string;
  /**
   * Callback function that is called when a new color is selected.
   */
  onValueChanged?: (event: { nativeEvent: { value: string } }) => void;
  /**
   * Optional style to apply to the ColorPicker component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Whether the color picker should support opacity.
   */
  supportsOpacity?: boolean;
};

const ColorPickerNativeView: React.ComponentType<
  Omit<ColorPickerProps, 'selection'> & {
    selection: ReturnType<typeof processColor>;
  }
> = requireNativeView('ExpoUI', 'ColorPickerView');

export function ColorPicker({ selection, ...restProps }: ColorPickerProps) {
  return <ColorPickerNativeView selection={processColor(selection || '')} {...restProps} />;
}
