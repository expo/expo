import { requireNativeView } from 'expo';
import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

import { ExpoModifier } from '../../types';

// @docsMissing
/**
 * Only for switch.
 */
type SwitchElementColors = {
  checkedThumbColor?: string;
  checkedTrackColor?: string;
  uncheckedThumbColor?: string;
  uncheckedTrackColor?: string;
};

// @docsMissing
/**
 * Only for checkbox.
 */
type CheckboxElementColors = {
  checkedColor?: string;
  disabledCheckedColor?: string;
  uncheckedColor?: string;
  disabledUncheckedColor?: string;
  checkmarkColor?: string;
  disabledIndeterminateColor?: string;
};

export type SwitchProps = {
  /**
   * Indicates whether the switch is checked.
   */
  value: boolean;
  /**
   * Label for the switch.
   *
   * > On Android, the label has an effect only when the `Switch` is used inside a `ContextMenu`.
   */
  label?: string;

  /**
   * Type of the switch component. Can be `'checkbox'`, `'switch'`, or `'button'`. The `'button'` style is iOS only.
   * @default 'switch'
   */
  variant?: 'checkbox' | 'switch' | 'button';
  /**
   * Callback function that is called when the checked state changes.
   */
  onValueChange?: (value: boolean) => void;
  /**
   * Optional style for the switch component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Picker color. On iOS, it only applies to the `menu` variant.
   */
  color?: string;

  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
} & (SwitchSwitchVariantProps | SwitchCheckboxVariantProps | SwitchButtonVariantProps);

export type SwitchSwitchVariantProps = {
  variant?: 'switch';
  /**
   * Colors for switch's core elements.
   * @platform android
   */
  elementColors?: SwitchElementColors;
};

export type SwitchCheckboxVariantProps = {
  variant: 'checkbox';
  /**
   * Colors for checkbox core elements.
   * @platform android
   */
  elementColors?: CheckboxElementColors;
};

export type SwitchButtonVariantProps = {
  variant: 'button';
  elementColors?: undefined;
};

type NativeSwitchProps = Omit<SwitchProps, 'onValueChange'> & {
  onValueChange: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
};

const SwitchNativeView: React.ComponentType<NativeSwitchProps> = requireNativeView(
  'ExpoUI',
  'SwitchView'
);

function getElementColors(props: SwitchProps) {
  if (props.variant === 'button') {
    return undefined;
  }
  if (!props.elementColors) {
    if (props.variant === 'switch') {
      return {
        checkedTrackColor: props.color,
      };
    } else {
      return {
        checkedColor: props.color,
      };
    }
  }
  return props.elementColors;
}

/**
 * @hidden
 */
export function transformSwitchProps(props: SwitchProps): NativeSwitchProps {
  return {
    ...props,
    variant: props.variant ?? 'switch',
    elementColors: getElementColors(props),
    color: props.color,
    onValueChange: ({ nativeEvent: { value } }) => {
      props?.onValueChange?.(value);
    },
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  } as NativeSwitchProps;
}

export function Switch(props: SwitchProps) {
  return <SwitchNativeView {...transformSwitchProps(props)} />;
}
