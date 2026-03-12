import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type SlotChildProps = {
  children: React.ReactNode;
};

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

// region AssistChip

export type AssistChipProps = {
  /**
   * Whether the chip is enabled and can be clicked.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback fired when the chip is clicked.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label, LeadingIcon, and TrailingIcon slots.
   */
  children?: React.ReactNode;
};

type NativeAssistChipProps = AssistChipProps;

const AssistChipNativeView: React.ComponentType<NativeAssistChipProps> = requireNativeView(
  'ExpoUI',
  'AssistChipView'
);

/**
 * Label slot for AssistChip.
 */
function AssistChipLabel(props: SlotChildProps) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * Leading icon slot for AssistChip.
 */
function AssistChipLeadingIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="leadingIcon">{props.children}</SlotNativeView>;
}

/**
 * Trailing icon slot for AssistChip.
 */
function AssistChipTrailingIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="trailingIcon">{props.children}</SlotNativeView>;
}

/**
 * An assist chip that helps users complete actions and primary tasks.
 */
function AssistChipComponent(props: AssistChipProps) {
  const { children, modifiers, onPress, ...restProps } = props;

  return (
    <AssistChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onPress={onPress}>
      {children}
    </AssistChipNativeView>
  );
}

AssistChipComponent.Label = AssistChipLabel;
AssistChipComponent.LeadingIcon = AssistChipLeadingIcon;
AssistChipComponent.TrailingIcon = AssistChipTrailingIcon;

export { AssistChipComponent as AssistChip };

// endregion

// region InputChip

export type InputChipProps = {
  /**
   * Whether the chip is enabled and can be interacted with.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether the chip is selected.
   * @default false
   */
  selected?: boolean;
  /**
   * Callback fired when the chip is clicked.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label, Avatar, and TrailingIcon slots.
   */
  children?: React.ReactNode;
};

type NativeInputChipProps = InputChipProps;

const InputChipNativeView: React.ComponentType<NativeInputChipProps> = requireNativeView(
  'ExpoUI',
  'InputChipView'
);

/**
 * Label slot for InputChip.
 */
function InputChipLabel(props: SlotChildProps) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * Avatar slot for InputChip.
 */
function InputChipAvatar(props: SlotChildProps) {
  return <SlotNativeView slotName="avatar">{props.children}</SlotNativeView>;
}

/**
 * Trailing icon slot for InputChip.
 */
function InputChipTrailingIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="trailingIcon">{props.children}</SlotNativeView>;
}

/**
 * An input chip that represents user input and can be dismissed.
 */
function InputChipComponent(props: InputChipProps) {
  const { children, modifiers, onPress, ...restProps } = props;

  return (
    <InputChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onPress={onPress}>
      {children}
    </InputChipNativeView>
  );
}

InputChipComponent.Label = InputChipLabel;
InputChipComponent.Avatar = InputChipAvatar;
InputChipComponent.TrailingIcon = InputChipTrailingIcon;

export { InputChipComponent as InputChip };

// endregion

// region SuggestionChip

export type SuggestionChipProps = {
  /**
   * Whether the chip is enabled and can be clicked.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback fired when the chip is clicked.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label and Icon slots.
   */
  children?: React.ReactNode;
};

type NativeSuggestionChipProps = SuggestionChipProps;

const SuggestionChipNativeView: React.ComponentType<NativeSuggestionChipProps> = requireNativeView(
  'ExpoUI',
  'SuggestionChipView'
);

/**
 * Label slot for SuggestionChip.
 */
function SuggestionChipLabel(props: SlotChildProps) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * Icon slot for SuggestionChip.
 */
function SuggestionChipIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="icon">{props.children}</SlotNativeView>;
}

/**
 * A suggestion chip that offers contextual suggestions and recommendations.
 */
function SuggestionChipComponent(props: SuggestionChipProps) {
  const { children, modifiers, onPress, ...restProps } = props;

  return (
    <SuggestionChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onPress={onPress}>
      {children}
    </SuggestionChipNativeView>
  );
}

SuggestionChipComponent.Label = SuggestionChipLabel;
SuggestionChipComponent.Icon = SuggestionChipIcon;

export { SuggestionChipComponent as SuggestionChip };

// endregion
