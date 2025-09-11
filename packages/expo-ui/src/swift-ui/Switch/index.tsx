import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SwitchProps = {
  /**
   * Indicates whether the switch is checked.
   */
  value: boolean;
  /**
   * Label for the switch.
   */
  label?: string;

  /**
   * Type of the switch component. Can be `'checkbox'`, `'switch'`, or `'button'`.
   * @default 'switch'
   */
  variant?: 'checkbox' | 'switch' | 'button';
  /**
   * Callback function that is called when the checked state changes.
   */
  onValueChange?: (value: boolean) => void;
  /**
   * Picker color. On iOS, it only applies to the `menu` variant.
   */
  color?: string;
} & (SwitchSwitchVariantProps | SwitchCheckboxVariantProps | SwitchButtonVariantProps) &
  CommonViewModifierProps;

export type SwitchSwitchVariantProps = {
  variant?: 'switch';
};

export type SwitchCheckboxVariantProps = {
  variant: 'checkbox';
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

function transformSwitchProps(props: SwitchProps): NativeSwitchProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    variant: props.variant ?? 'switch',
    color: props.color,
    onValueChange: ({ nativeEvent: { value } }) => {
      props?.onValueChange?.(value);
    },
  } as NativeSwitchProps;
}

/**
 * Displays a native switch component.
 */
export function Switch(props: SwitchProps) {
  return <SwitchNativeView {...transformSwitchProps(props)} />;
}
