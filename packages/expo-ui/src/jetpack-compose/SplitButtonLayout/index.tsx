import { requireNativeView } from 'expo';

import type { ModifierConfig, ViewEvent } from '../../types';
import type { ButtonColors } from '../Button';
import { createViewModifierEventListener } from '../modifiers/utils';

export type { ButtonColors };

export interface SplitButtonLayoutProps {
  /**
   * The space between the leading and trailing buttons, in dp.
   * @default SplitButtonDefaults.Spacing
   */
  spacing?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * The `SplitButtonLayout.LeadingButton` and `SplitButtonLayout.TrailingButton` slots.
   */
  children: React.ReactNode;
}

type SlotProps = {
  children: React.ReactNode;
};

export interface SplitButtonLeadingButtonProps {
  /**
   * Callback that is called when the leading button is clicked.
   */
  onClick?: () => void;
  /**
   * Whether the button is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for the button. Unset colors use `ButtonDefaults.buttonColors()`.
   */
  colors?: ButtonColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Content to display inside the button.
   */
  children: React.ReactNode;
}

export interface SplitButtonTrailingButtonProps {
  /**
   * Whether the trailing button is checked. This usually matches the menu's `expanded` state.
   */
  checked: boolean;
  /**
   * Callback that is called with the new checked state when the button is clicked.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Whether the button is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for the button. Unset colors use `ButtonDefaults.buttonColors()`.
   */
  colors?: ButtonColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Content to display inside the button, usually an icon.
   */
  children: React.ReactNode;
}

type NativeSplitButtonLeadingButtonProps = Omit<SplitButtonLeadingButtonProps, 'onClick'> &
  ViewEvent<'onButtonPressed', void>;

type NativeSplitButtonTrailingButtonProps = Omit<
  SplitButtonTrailingButtonProps,
  'onCheckedChange'
> &
  ViewEvent<'onCheckedChange', { checked: boolean }>;

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SplitButtonLayoutNativeView: React.ComponentType<SplitButtonLayoutProps> = requireNativeView(
  'ExpoUI',
  'SplitButtonLayoutView'
);

const SplitButtonLeadingButtonNativeView: React.ComponentType<NativeSplitButtonLeadingButtonProps> =
  requireNativeView('ExpoUI', 'SplitButtonLeadingButtonView');

const SplitButtonTrailingButtonNativeView: React.ComponentType<NativeSplitButtonTrailingButtonProps> =
  requireNativeView('ExpoUI', 'SplitButtonTrailingButtonView');

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * The leading button of a split button, which runs the primary action.
 * Goes in the `SplitButtonLayout.LeadingButton` slot.
 * Wraps `SplitButtonDefaults.LeadingButton`.
 */
function SplitButtonLeadingButton(props: SplitButtonLeadingButtonProps) {
  const { onClick, modifiers, ...restProps } = props;
  return (
    <SplitButtonLeadingButtonNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      enabled={props.enabled ?? true}
      onButtonPressed={onClick ? () => onClick() : undefined}
    />
  );
}

/**
 * The trailing button of a split button, which usually opens a `DropdownMenu` of related actions.
 * Goes in the `SplitButtonLayout.TrailingButton` slot.
 * Wraps `SplitButtonDefaults.TrailingButton`.
 */
function SplitButtonTrailingButton(props: SplitButtonTrailingButtonProps) {
  const { onCheckedChange, modifiers, ...restProps } = props;
  return (
    <SplitButtonTrailingButtonNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      enabled={props.enabled ?? true}
      onCheckedChange={
        onCheckedChange ? ({ nativeEvent: { checked } }) => onCheckedChange(checked) : undefined
      }
    />
  );
}

/**
 * Leading button slot for `SplitButtonLayout`. Usually holds a `SplitButtonLeadingButton`.
 */
function SplitButtonLayoutLeadingButton(props: SlotProps) {
  return <SlotNativeView slotName="leadingButton">{props.children}</SlotNativeView>;
}

/**
 * Trailing button slot for `SplitButtonLayout`. Usually holds a `SplitButtonTrailingButton`,
 * or a `DropdownMenu` whose trigger is a `SplitButtonTrailingButton`.
 */
function SplitButtonLayoutTrailingButton(props: SlotProps) {
  return <SlotNativeView slotName="trailingButton">{props.children}</SlotNativeView>;
}

/**
 * A Material 3 split button layout: a leading button for the primary action and a trailing button,
 * usually for a menu of related actions. Both buttons take the same height.
 */
function SplitButtonLayout(props: SplitButtonLayoutProps) {
  const { modifiers, ...restProps } = props;
  return (
    <SplitButtonLayoutNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

SplitButtonLayout.LeadingButton = SplitButtonLayoutLeadingButton;
SplitButtonLayout.TrailingButton = SplitButtonLayoutTrailingButton;

export { SplitButtonLayout, SplitButtonLeadingButton, SplitButtonTrailingButton };
