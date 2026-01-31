import { requireNativeView } from 'expo';
import { Children } from 'react';
import { NativeSyntheticEvent, type ColorValue } from 'react-native';

import { ExpoModifier } from '../../types';
import { ExpoUIModule } from '../ExpoUIModule';
import { createViewModifierEventListener } from '../modifiers/utils';

// @docsMissing
/**
 * Only for switch.
 */
type SwitchElementColors = {
  checkedThumbColor?: ColorValue;
  checkedTrackColor?: ColorValue;
  uncheckedThumbColor?: ColorValue;
  uncheckedTrackColor?: ColorValue;
};

// @docsMissing
/**
 * Only for checkbox.
 */
type CheckboxElementColors = {
  checkedColor?: ColorValue;
  disabledCheckedColor?: ColorValue;
  uncheckedColor?: ColorValue;
  disabledUncheckedColor?: ColorValue;
  checkmarkColor?: ColorValue;
  disabledIndeterminateColor?: ColorValue;
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
   * Type of the switch component. Can be `'checkbox'`, `'switch'`, or `'button'`.
   * @default 'switch'
   */
  variant?: 'checkbox' | 'switch' | 'button';
  /**
   * Callback function that is called when the checked state changes.
   */
  onValueChange?: (value: boolean) => void;

  /**
   * Picker color.
   */
  color?: ColorValue;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * Children containing ThumbContent slot.
   * @platform android
   */
  children?: React.ReactNode;
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
  return <>{props.children}</>;
}
SwitchThumbContent.tag = 'ThumbContent';

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

function transformSwitchProps(props: SwitchProps): Omit<NativeSwitchProps, 'children'> {
  const { modifiers, children, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    variant: props.variant ?? 'switch',
    elementColors: getElementColors(props),
    color: props.color,
    onValueChange: ({ nativeEvent: { value } }) => {
      props?.onValueChange?.(value);
    },
  } as Omit<NativeSwitchProps, 'children'>;
}

function SwitchComponent(props: SwitchProps) {
  const { children } = props;

  let thumbContent: React.ReactNode = null;

  Children.forEach(children as any, (child) => {
    if (child?.type?.tag === SwitchThumbContent.tag) {
      thumbContent = child.props.children;
    }
  });

  return (
    <SwitchNativeView {...transformSwitchProps(props)}>
      {thumbContent && <SlotNativeView slotName="thumbContent">{thumbContent}</SlotNativeView>}
    </SwitchNativeView>
  );
}

SwitchComponent.ThumbContent = SwitchThumbContent;
SwitchComponent.DefaultIconSize = ExpoUIModule.SwitchDefaultIconSize;

export { SwitchComponent as Switch };
