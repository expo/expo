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
  /**
   * Colors for switch's core elements.
   * @platform android
   */
  elementColors?: {
    /**
     * Only for switch.
     */
    checkedThumbColor?: string;
    /**
     * Only for switch.
     */
    checkedTrackColor?: string;
    /**
     * Only for switch.
     */
    uncheckedThumbColor?: string;
    /**
     * Only for switch.
     */
    uncheckedTrackColor?: string;
    /**
     * Only for checkbox.
     */
    checkedColor?: string;
    /**
     * Only for checkbox.
     */
    disabledCheckedColor?: string;
    /**
     * Only for checkbox.
     */
    uncheckedColor?: string;
    /**
     * Only for checkbox.
     */
    disabledUncheckedColor?: string;
    /**
     * Only for checkbox.
     */
    checkmarkColor?: string;
    /**
     * Only for checkbox.
     */
    disabledIndeterminateColor?: string;
  };
  /**
   * Picker color. On iOS it only applies to the `menu` variant.
   */
  color?: string;
};

const SwitchNativeView: React.ComponentType<SwitchProps> = requireNativeView(
  'ExpoUI',
  'SwitchView'
);

type NativeSwitchProps = SwitchProps;

export function transformSwitchProps(props: SwitchProps): NativeSwitchProps {
  return {
    ...props,
    elementColors: props.elementColors
      ? props.elementColors
      : props.color
        ? {
            checkedTrackColor: props.color,
            checkedColor: props.color,
          }
        : undefined,
    color: props.color,
  };
}

export function Switch(props: SwitchProps) {
  return <SwitchNativeView {...transformSwitchProps(props)} />;
}
