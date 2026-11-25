import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import type { MenuShapePosition } from './index';

const SlotNativeView: React.ComponentType<{
  slotName: string;
  children: React.ReactNode;
}> = requireNativeView('ExpoUI', 'SlotView');

/**
 * Color overrides for the `SelectableDropdownMenuItem` component. Each color defaults to the
 * value of Compose's `MenuDefaults.selectableItemColors()`.
 */
export type SelectableDropdownMenuItemColors = {
  textColor?: ColorValue;
  containerColor?: ColorValue;
  leadingIconColor?: ColorValue;
  trailingContentColor?: ColorValue;
  disabledTextColor?: ColorValue;
  disabledContainerColor?: ColorValue;
  disabledLeadingIconColor?: ColorValue;
  disabledTrailingContentColor?: ColorValue;
  selectedTextColor?: ColorValue;
  selectedContainerColor?: ColorValue;
  selectedLeadingIconColor?: ColorValue;
  selectedTrailingContentColor?: ColorValue;
};

/**
 * Props of the `SelectableDropdownMenuItem` component.
 */
export interface SelectableDropdownMenuItemProps {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Callback that is called when the item is clicked.
   */
  onClick?: () => void;
  /**
   * The position of the item in its `DropdownMenuGroup`, which sets its shape through Compose's
   * `MenuDefaults.itemShape(index, count)`. Defaults to `MenuDefaults.itemShapes()`, the shape of a
   * single item.
   */
  shapes?: MenuShapePosition;
  /**
   * Whether the item is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Color overrides for the item.
   */
  colors?: SelectableDropdownMenuItemColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Slot children for the text, the icons, and the supporting text.
   */
  children?: React.ReactNode;
}

type NativeSelectableDropdownMenuItemProps = Omit<
  SelectableDropdownMenuItemProps,
  'onClick' | 'children'
> &
  ViewEvent<'onItemPressed', void> & { children?: React.ReactNode };

const SelectableDropdownMenuItemNativeView: React.ComponentType<NativeSelectableDropdownMenuItemProps> =
  requireNativeView('ExpoUI', 'SelectableDropdownMenuItemView');

/**
 * A text slot for `SelectableDropdownMenuItem`.
 *
 * @platform android
 */
function TextSlot(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="text">{props.children}</SlotNativeView>;
}

/**
 * A leading icon slot for `SelectableDropdownMenuItem`. When the item also has a
 * `SelectedLeadingIcon`, this icon shows only while the item is not selected.
 *
 * @platform android
 */
function LeadingIcon(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="leadingIcon">{props.children}</SlotNativeView>;
}

/**
 * A leading icon slot for `SelectableDropdownMenuItem`, shown while the item is selected.
 *
 * @platform android
 */
function SelectedLeadingIcon(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="selectedLeadingIcon">{props.children}</SlotNativeView>;
}

/**
 * A trailing content slot for `SelectableDropdownMenuItem`, shown after the text.
 *
 * @platform android
 */
function TrailingContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="trailingContent">{props.children}</SlotNativeView>;
}

/**
 * A supporting text slot for `SelectableDropdownMenuItem`, shown below the text.
 *
 * @platform android
 */
function SupportingText(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="supportingText">{props.children}</SlotNativeView>;
}

/**
 * A Material 3 Expressive menu item that wraps Compose's `SelectableDropdownMenuItem`, for a
 * choice of one option. A selected item gets a highlighted container and shows its
 * `SelectedLeadingIcon`.
 *
 * @platform android
 */
export function SelectableDropdownMenuItem(props: SelectableDropdownMenuItemProps) {
  const { onClick, modifiers, children, ...restProps } = props;
  return (
    <SelectableDropdownMenuItemNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      enabled={props.enabled ?? true}
      onItemPressed={onClick ? () => onClick() : undefined}>
      {children}
    </SelectableDropdownMenuItemNativeView>
  );
}

SelectableDropdownMenuItem.Text = TextSlot;
SelectableDropdownMenuItem.LeadingIcon = LeadingIcon;
SelectableDropdownMenuItem.SelectedLeadingIcon = SelectedLeadingIcon;
SelectableDropdownMenuItem.TrailingContent = TrailingContent;
SelectableDropdownMenuItem.SupportingText = SupportingText;
