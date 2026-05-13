import { requireNativeView } from 'expo';
import type { NativeSyntheticEvent, ColorValue } from 'react-native';

import type { ModifierConfig } from '../../types';
import { ExpoUIModule } from '../ExpoUIModule';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for switch core elements.
 */
export type SwitchColors = {
  checkedThumbColor?: ColorValue;
  checkedTrackColor?: ColorValue;
  checkedBorderColor?: ColorValue;
  checkedIconColor?: ColorValue;
  uncheckedThumbColor?: ColorValue;
  uncheckedTrackColor?: ColorValue;
  uncheckedBorderColor?: ColorValue;
  uncheckedIconColor?: ColorValue;
  disabledCheckedThumbColor?: ColorValue;
  disabledCheckedTrackColor?: ColorValue;
  disabledCheckedBorderColor?: ColorValue;
  disabledCheckedIconColor?: ColorValue;
  disabledUncheckedThumbColor?: ColorValue;
  disabledUncheckedTrackColor?: ColorValue;
  disabledUncheckedBorderColor?: ColorValue;
  disabledUncheckedIconColor?: ColorValue;
};

export type SwitchProps = {
  /**
   * Indicates whether the switch is checked.
   */
  value: boolean;
  /**
   * Whether the switch is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback function that is called when the checked state changes.
   */
  onCheckedChange?: (value: boolean) => void;
  /**
   * Colors for switch core elements.
   */
  colors?: SwitchColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing ThumbContent slot.
   * @platform android
   */
  children?: React.ReactNode;
};

type NativeSwitchProps = Omit<SwitchProps, 'onCheckedChange' | 'children'> & {
  children?: React.ReactNode;
  onCheckedChange: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
};

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

type ThumbContentProps = {
  children: React.ReactNode;
};

const SwitchNativeView: React.ComponentType<NativeSwitchProps> = requireNativeView(
  'ExpoUI',
  'SwitchView'
);

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Custom content to be displayed inside the switch thumb.
 * @platform android
 */
export function SwitchThumbContent(props: ThumbContentProps) {
  return <SlotNativeView slotName="thumbContent">{props.children}</SlotNativeView>;
}

function transformSwitchProps(props: SwitchProps): Omit<NativeSwitchProps, 'children'> {
  const { modifiers, children, onCheckedChange, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onCheckedChange: ({ nativeEvent: { value } }) => {
      onCheckedChange?.(value);
    },
  };
}

/**
 * A switch component.
 */
function SwitchComponent(props: SwitchProps) {
  return <SwitchNativeView {...transformSwitchProps(props)}>{props.children}</SwitchNativeView>;
}

SwitchComponent.ThumbContent = SwitchThumbContent;
SwitchComponent.DefaultIconSize = ExpoUIModule.SwitchDefaultIconSize;

export { SwitchComponent as Switch };
