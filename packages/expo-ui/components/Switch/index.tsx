import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

export type SwitchProps = {
  /**
   * Indicates whether the switch is checked.
   */
  checked: boolean;
  /**
   * Label for the switch.
   *
   * > On Android the label has an effect only when the `Switch` is used inside a `ContextMenu`.
   * @platform ios
   */
  label?: string;

  /**
   * Type of the switch component. Can be 'checkbox', 'switch', or 'button'. The 'button' style is iOS only.
   */
  variant: 'checkbox' | 'switch' | 'button';

  /**
   * Callback function that is called when the checked state changes.
   */
  onCheckedChanged: (event: { nativeEvent: { checked: boolean } }) => void;
  /**
   * Optional style for the switch component.
   */
  style?: StyleProp<ViewStyle>;
};

const SwitchNativeView: React.ComponentType<SwitchProps> = requireNativeView(
  'ExpoUI',
  'SwitchView'
);

export function Switch(props: SwitchProps) {
  return <SwitchNativeView {...props} />;
}
