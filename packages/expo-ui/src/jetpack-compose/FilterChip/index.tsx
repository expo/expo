import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

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

type SlotChildProps = {
  children: React.ReactNode;
};

type NativeFilterChipProps = FilterChipProps;

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const FilterChipNativeView: React.ComponentType<NativeFilterChipProps> = requireNativeView(
  'ExpoUI',
  'FilterChipView'
);

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
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
 * A filter chip component following Material 3 design guidelines.
 * Supports slot-based `Label`, `LeadingIcon`, and `TrailingIcon` children.
 */
function FilterChipComponent(props: FilterChipProps) {
  const { children, modifiers, onPress, ...restProps } = props;

  return (
    <FilterChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onPress={onPress}>
      {children}
    </FilterChipNativeView>
  );
}

FilterChipComponent.Label = FilterChipLabel;
FilterChipComponent.LeadingIcon = FilterChipLeadingIcon;
FilterChipComponent.TrailingIcon = FilterChipTrailingIcon;

export { FilterChipComponent as FilterChip };
