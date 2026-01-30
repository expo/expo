import { requireNativeView } from 'expo';
import { Children } from 'react';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type FilterChipProps = {
  /**
   * Whether the chip is currently selected.
   */
  selected: boolean;
  /**
   * The text label to display on the chip.
   */
  label: string;
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
  modifiers?: ExpoModifier[];
  /**
   * Children containing LeadingIcon and TrailingIcon slots.
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
 * Leading icon slot for FilterChip.
 */
function FilterChipLeadingIcon(props: SlotChildProps) {
  return <>{props.children}</>;
}
FilterChipLeadingIcon.tag = 'LeadingIcon';

/**
 * Trailing icon slot for FilterChip.
 */
function FilterChipTrailingIcon(props: SlotChildProps) {
  return <>{props.children}</>;
}
FilterChipTrailingIcon.tag = 'TrailingIcon';

/**
 * A filter chip component following Material 3 design guidelines.
 * Supports slot-based `LeadingIcon` and `TrailingIcon` children.
 */
function FilterChipComponent(props: FilterChipProps) {
  const { children, modifiers, onPress, ...restProps } = props;

  let leadingIconContent: React.ReactNode = null;
  let trailingIconContent: React.ReactNode = null;

  Children.forEach(children as any, (child) => {
    if (child?.type?.tag === FilterChipLeadingIcon.tag) {
      leadingIconContent = child.props.children;
    } else if (child?.type?.tag === FilterChipTrailingIcon.tag) {
      trailingIconContent = child.props.children;
    }
  });

  return (
    <FilterChipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onPress={onPress}>
      {leadingIconContent && (
        <SlotNativeView slotName="leadingIcon">{leadingIconContent}</SlotNativeView>
      )}
      {trailingIconContent && (
        <SlotNativeView slotName="trailingIcon">{trailingIconContent}</SlotNativeView>
      )}
    </FilterChipNativeView>
  );
}

FilterChipComponent.LeadingIcon = FilterChipLeadingIcon;
FilterChipComponent.TrailingIcon = FilterChipTrailingIcon;

export { FilterChipComponent as FilterChip };
