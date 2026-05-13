import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for AssistChip.
 */
export type AssistChipColors = {
  containerColor?: ColorValue;
  labelColor?: ColorValue;
  leadingIconContentColor?: ColorValue;
  trailingIconContentColor?: ColorValue;
};

/**
 * Colors for FilterChip.
 */
export type FilterChipColors = {
  containerColor?: ColorValue;
  labelColor?: ColorValue;
  iconColor?: ColorValue;
  selectedContainerColor?: ColorValue;
  selectedLabelColor?: ColorValue;
  selectedLeadingIconColor?: ColorValue;
  selectedTrailingIconColor?: ColorValue;
};

/**
 * Colors for InputChip.
 */
export type InputChipColors = {
  containerColor?: ColorValue;
  labelColor?: ColorValue;
  leadingIconColor?: ColorValue;
  trailingIconColor?: ColorValue;
  selectedContainerColor?: ColorValue;
  selectedLabelColor?: ColorValue;
  selectedLeadingIconColor?: ColorValue;
  selectedTrailingIconColor?: ColorValue;
};

/**
 * Colors for SuggestionChip.
 */
export type SuggestionChipColors = {
  containerColor?: ColorValue;
  labelColor?: ColorValue;
  iconContentColor?: ColorValue;
};

/**
 * Border configuration for chips.
 */
export type ChipBorder = {
  /**
   * Border width in dp.
   * @default 1
   */
  width?: number;
  /**
   * Border color.
   */
  color?: ColorValue;
};

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
   * Colors for the chip's container, label, and icons.
   */
  colors?: AssistChipColors;
  /**
   * Elevation in dp.
   */
  elevation?: number;
  /**
   * Border configuration.
   */
  border?: ChipBorder;
  /**
   * Callback fired when the chip is clicked.
   */
  onClick?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label, LeadingIcon, and TrailingIcon slots.
   */
  children: React.ReactNode;
};

type NativeAssistChipProps = Omit<AssistChipProps, 'onClick'> & {
  onNativeClick?: () => void;
};

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
  const { children, modifiers, onClick, ...restProps } = props;

  return (
    <AssistChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onNativeClick={onClick}>
      {children}
    </AssistChipNativeView>
  );
}

AssistChipComponent.Label = AssistChipLabel;
AssistChipComponent.LeadingIcon = AssistChipLeadingIcon;
AssistChipComponent.TrailingIcon = AssistChipTrailingIcon;

export { AssistChipComponent as AssistChip };

// endregion

// region FilterChip

export type FilterChipProps = {
  /**
   * Whether the chip is currently selected.
   */
  selected: boolean;
  /**
   * Whether the chip is enabled and can be interacted with.
   */
  enabled?: boolean;
  /**
   * Colors for the chip's container, label, icon, and selected states.
   */
  colors?: FilterChipColors;
  /**
   * Elevation in dp.
   */
  elevation?: number;
  /**
   * Border configuration.
   */
  border?: ChipBorder;
  /**
   * Callback fired when the chip is clicked.
   */
  onClick?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label, LeadingIcon, and TrailingIcon slots.
   */
  children: React.ReactNode;
};

type NativeFilterChipProps = Omit<FilterChipProps, 'onClick'> & {
  onNativeClick?: () => void;
};

const FilterChipNativeView: React.ComponentType<NativeFilterChipProps> = requireNativeView(
  'ExpoUI',
  'FilterChipView'
);

/**
 * Label slot for FilterChip.
 */
function FilterChipLabel(props: SlotChildProps) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * Leading icon slot for FilterChip.
 */
function FilterChipLeadingIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="leadingIcon">{props.children}</SlotNativeView>;
}

/**
 * Trailing icon slot for FilterChip.
 */
function FilterChipTrailingIcon(props: SlotChildProps) {
  return <SlotNativeView slotName="trailingIcon">{props.children}</SlotNativeView>;
}

/**
 * A filter chip component for refining content with selection/deselection.
 */
function FilterChipComponent(props: FilterChipProps) {
  const { children, modifiers, onClick, ...restProps } = props;

  return (
    <FilterChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onNativeClick={onClick}>
      {children}
    </FilterChipNativeView>
  );
}

FilterChipComponent.Label = FilterChipLabel;
FilterChipComponent.LeadingIcon = FilterChipLeadingIcon;
FilterChipComponent.TrailingIcon = FilterChipTrailingIcon;

export { FilterChipComponent as FilterChip };

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
   * Colors for the chip's container, label, icons, and selected states.
   */
  colors?: InputChipColors;
  /**
   * Elevation in dp.
   */
  elevation?: number;
  /**
   * Border configuration.
   */
  border?: ChipBorder;
  /**
   * Callback fired when the chip is clicked.
   */
  onClick?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label, Avatar, and TrailingIcon slots.
   */
  children: React.ReactNode;
};

type NativeInputChipProps = Omit<InputChipProps, 'onClick'> & {
  onNativeClick?: () => void;
};

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
  const { children, modifiers, onClick, ...restProps } = props;

  return (
    <InputChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onNativeClick={onClick}>
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
   * Colors for the chip's container, label, and icon.
   */
  colors?: SuggestionChipColors;
  /**
   * Elevation in dp.
   */
  elevation?: number;
  /**
   * Border configuration.
   */
  border?: ChipBorder;
  /**
   * Callback fired when the chip is clicked.
   */
  onClick?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing Label and Icon slots.
   */
  children: React.ReactNode;
};

type NativeSuggestionChipProps = Omit<SuggestionChipProps, 'onClick'> & {
  onNativeClick?: () => void;
};

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
  const { children, modifiers, onClick, ...restProps } = props;

  return (
    <SuggestionChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onNativeClick={onClick}>
      {children}
    </SuggestionChipNativeView>
  );
}

SuggestionChipComponent.Label = SuggestionChipLabel;
SuggestionChipComponent.Icon = SuggestionChipIcon;

export { SuggestionChipComponent as SuggestionChip };

// endregion
