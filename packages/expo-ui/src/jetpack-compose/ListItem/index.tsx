import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for list item elements, matching `ListItemDefaults.colors()`.
 */
export type ListItemColors = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  leadingContentColor?: ColorValue;
  trailingContentColor?: ColorValue;
  supportingContentColor?: ColorValue;
  overlineContentColor?: ColorValue;
};

export type ListItemProps = {
  /**
   * Colors for list item elements.
   */
  colors?: ListItemColors;
  /**
   * Tonal elevation in dp.
   * @default ListItemDefaults.Elevation
   */
  tonalElevation?: number;
  /**
   * Shadow elevation in dp.
   * @default ListItemDefaults.Elevation
   */
  shadowElevation?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing slot sub-components.
   */
  children?: React.ReactNode;
};

type SlotProps = {
  slotName: string;
  children: React.ReactNode;
};

const ListItemNativeView: React.ComponentType<ListItemProps> = requireNativeView(
  'ExpoUI',
  'ListItemView'
);

const SlotNativeView: React.ComponentType<SlotProps> = requireNativeView('ExpoUI', 'SlotView');

function transformProps(props: ListItemProps): ListItemProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Headline content slot. Overrides the `headline` string prop.
 */
function HeadlineContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="headlineContent">{props.children}</SlotNativeView>;
}

/**
 * Overline content slot. Overrides the `overlineText` string prop.
 */
function OverlineContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="overlineContent">{props.children}</SlotNativeView>;
}

/**
 * Supporting content slot. Overrides the `supportingText` string prop.
 */
function SupportingContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="supportingContent">{props.children}</SlotNativeView>;
}

/**
 * Leading content slot (icon, avatar, etc).
 */
function LeadingContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="leadingContent">{props.children}</SlotNativeView>;
}

/**
 * Trailing content slot (icon, text, switch, etc).
 */
function TrailingContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="trailingContent">{props.children}</SlotNativeView>;
}

/**
 * A list item matching Compose's `ListItem`.
 */
function ListItemComponent(props: ListItemProps) {
  const { children, ...restProps } = props;
  return <ListItemNativeView {...transformProps(restProps)}>{children}</ListItemNativeView>;
}

ListItemComponent.HeadlineContent = HeadlineContent;
ListItemComponent.OverlineContent = OverlineContent;
ListItemComponent.SupportingContent = SupportingContent;
ListItemComponent.LeadingContent = LeadingContent;
ListItemComponent.TrailingContent = TrailingContent;

export { ListItemComponent as ListItem };
