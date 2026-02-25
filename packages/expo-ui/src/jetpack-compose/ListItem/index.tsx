import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for list item's core elements.
 */
export type ListItemColors = {
  containerColor?: ColorValue;
  headlineColor?: ColorValue;
  leadingIconColor?: ColorValue;
  trailingIconColor?: ColorValue;
  supportingColor?: ColorValue;
  overlineColor?: ColorValue;
};

export type ListItemProps = {
  /**
   * The main text content of the list item.
   */
  headline: string;
  /**
   * Optional supporting text displayed below the headline.
   */
  supportingText?: string;
  /**
   * Optional overline text displayed above the headline.
   */
  overlineText?: string;
  /**
   * The background color of the list item.
   */
  color?: ColorValue;
  /**
   * Colors for list item's core elements.
   */
  colors?: ListItemColors;
  /**
   * Callback that is called when the list item is pressed.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
  /**
   * Children containing Leading and Trailing slots.
   */
  children?: React.ReactNode;
};

type LeadingProps = {
  children: React.ReactNode;
};

type TrailingProps = {
  children: React.ReactNode;
};

type SupportingContentProps = {
  children: React.ReactNode;
};

type NativeListItemProps = Omit<ListItemProps, 'onPress'> & {
  onPress?: () => void;
};

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const ListItemNativeView: React.ComponentType<NativeListItemProps> = requireNativeView(
  'ExpoUI',
  'ListItemView'
);

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Leading content slot for ListItem.
 */
export function ListItemLeading(props: LeadingProps) {
  return <SlotNativeView slotName="leading">{props.children}</SlotNativeView>;
}

/**
 * Trailing content slot for ListItem.
 */
export function ListItemTrailing(props: TrailingProps) {
  return <SlotNativeView slotName="trailing">{props.children}</SlotNativeView>;
}

/**
 * Custom supporting content slot for ListItem.
 * When provided, this takes precedence over the `supportingText` prop.
 * @platform android
 */
export function ListItemSupportingContent(props: SupportingContentProps) {
  return <SlotNativeView slotName="supportingContent">{props.children}</SlotNativeView>;
}

/**
 * A list item component following Material 3 design guidelines.
 */
function ListItemComponent(props: ListItemProps) {
  const { children, modifiers, onPress, ...restProps } = props;

  return (
    <ListItemNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onPress={onPress}>
      {children}
    </ListItemNativeView>
  );
}

ListItemComponent.Leading = ListItemLeading;
ListItemComponent.Trailing = ListItemTrailing;
ListItemComponent.SupportingContent = ListItemSupportingContent;

export { ListItemComponent as ListItem };
