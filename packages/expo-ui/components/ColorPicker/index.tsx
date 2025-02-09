import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * Props for the ColorPicker component.
 */
export type ColorPickerProps = {
  /**
   * The index of the currently selected option.
   */
  selection: string | null;
  /**
   * A label displayed on the ColorPicker when in `menu` variant inside a form section on iOS.
   * @platform iOS
   */
  label?: string;
  /**
   * Callback function that is called when an option is selected.
   */
  onValueChanged?: (event: { nativeEvent: { hex: string } }) => void;
  /**
   * Optional style to apply to the ColorPicker component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Whether the color picker should support opacity.
   */
  supportsOpacity?: boolean;
};

const ColorPickerNativeView: React.ComponentType<ColorPickerProps> = requireNativeView(
  'ExpoUI',
  'ColorPickerView'
);

export function ColorPicker(props: ColorPickerProps) {
  return <ColorPickerNativeView {...props} />;
}
