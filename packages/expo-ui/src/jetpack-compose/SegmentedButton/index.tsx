import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for the segmented button in different states.
 */
export type SegmentedButtonColors = {
  activeBorderColor?: ColorValue;
  activeContentColor?: ColorValue;
  inactiveBorderColor?: ColorValue;
  inactiveContentColor?: ColorValue;
  disabledActiveBorderColor?: ColorValue;
  disabledActiveContentColor?: ColorValue;
  disabledInactiveBorderColor?: ColorValue;
  disabledInactiveContentColor?: ColorValue;
  activeContainerColor?: ColorValue;
  inactiveContainerColor?: ColorValue;
  disabledActiveContainerColor?: ColorValue;
  disabledInactiveContainerColor?: ColorValue;
};

export type SegmentedButtonProps = {
  /**
   * Whether the button is currently selected (used inside `SingleChoiceSegmentedButtonRow`).
   */
  selected?: boolean;
  /**
   * Callback that is called when the button is clicked (used inside `SingleChoiceSegmentedButtonRow`).
   */
  onClick?: () => void;
  /**
   * Whether the button is currently checked (used inside `MultiChoiceSegmentedButtonRow`).
   */
  checked?: boolean;
  /**
   * Callback that is called when the checked state changes (used inside `MultiChoiceSegmentedButtonRow`).
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Whether the button is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for the button in different states.
   */
  colors?: SegmentedButtonColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing a `Label` slot.
   */
  children?: React.ReactNode;
};

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

type NativeSegmentedButtonProps = Omit<SegmentedButtonProps, 'onClick' | 'onCheckedChange'> &
  ViewEvent<'onButtonPressed', void> &
  ViewEvent<'onCheckedChange', { value: boolean }>;

const SegmentedButtonNativeView: React.ComponentType<NativeSegmentedButtonProps> =
  requireNativeView('ExpoUI', 'SegmentedButtonView');

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Label slot for `SegmentedButton`.
 */
function SegmentedButtonLabel(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * A Material 3 segmented button. Must be used inside a `SingleChoiceSegmentedButtonRow`
 * or `MultiChoiceSegmentedButtonRow`.
 */
function SegmentedButtonComponent(props: SegmentedButtonProps) {
  const { children, modifiers, onClick, onCheckedChange, ...restProps } = props;
  return (
    <SegmentedButtonNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onButtonPressed={() => onClick?.()}
      onCheckedChange={(e) => onCheckedChange?.(e.nativeEvent.value)}>
      {children}
    </SegmentedButtonNativeView>
  );
}

SegmentedButtonComponent.Label = SegmentedButtonLabel;

export { SegmentedButtonComponent as SegmentedButton };
export { SingleChoiceSegmentedButtonRow } from '../SingleChoiceSegmentedButtonRow';
export type { SingleChoiceSegmentedButtonRowProps } from '../SingleChoiceSegmentedButtonRow';
export { MultiChoiceSegmentedButtonRow } from '../MultiChoiceSegmentedButtonRow';
export type { MultiChoiceSegmentedButtonRowProps } from '../MultiChoiceSegmentedButtonRow';
