import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type SlotNativeViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SlotNativeView: React.ComponentType<SlotNativeViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Color overrides for the `DropdownMenuItem` component.
 */
export type DropdownMenuItemElementColors = {
  /** Color of the menu item text. */
  textColor?: ColorValue;
  /** Color of the text when the menu item is disabled. */
  disabledTextColor?: ColorValue;
  // TODO: At the moment IconView's tint color defaults to Color.Unspecified instead of LocalContentColor.current.
  // Thus the color override will not work for icons. At the moment icon color can only be set directly in IconView.
  // leadingIconColor?: ColorValue;
  // trailingIconColor?: ColorValue;
  // disabledLeadingIconColor?: ColorValue;
  // disabledTrailingIconColor?: ColorValue;
};

/**
 * Props of the `DropdownMenuItem` component.
 */
export type DropdownMenuItemProps = {
  /**
   * Whether the menu item is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Color overrides for the menu item.
   */
  elementColors?: DropdownMenuItemElementColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Callback that is called when the menu item is clicked.
   */
  onClick?: () => void;
  /**
   * Slot children for text, leading/trailing icons.
   */
  children?: React.ReactNode;
};

type NativeDropdownMenuItemProps = Omit<DropdownMenuItemProps, 'onClick' | 'children'> &
  ViewEvent<'onItemPressed', void> & { children?: React.ReactNode };

const DropdownMenuItemNativeView: React.ComponentType<NativeDropdownMenuItemProps> =
  requireNativeView('ExpoUI', 'DropdownMenuItemView');

/**
 * A leading icon slot for `DropdownMenuItem`.
 * Wrap an `Icon` or other content to display before the menu item text.
 *
 * @platform android
 */
function LeadingIcon(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="leadingIcon">{props.children}</SlotNativeView>;
}

/**
 * A trailing icon slot for `DropdownMenuItem`.
 * Wrap an `Icon` or other content to display after the menu item text.
 *
 * @platform android
 */
function TrailingIcon(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="trailingIcon">{props.children}</SlotNativeView>;
}

/**
 * A text slot for `DropdownMenuItem`.
 * Wrap text content to display as the menu item label.
 *
 * @platform android
 */
function TextSlot(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="text">{props.children}</SlotNativeView>;
}

/**
 * A dropdown menu item component that wraps Compose's `DropdownMenuItem`.
 * Should be used inside `DropdownMenu.Items` or `ExposedDropdownMenu`.
 *
 * @platform android
 */
function DropdownMenuItemComponent(props: DropdownMenuItemProps) {
  const { onClick, modifiers, children, ...restProps } = props;
  return (
    <DropdownMenuItemNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      enabled={props.enabled ?? true}
      onItemPressed={onClick ? () => onClick() : undefined}>
      {children}
    </DropdownMenuItemNativeView>
  );
}

DropdownMenuItemComponent.Text = TextSlot;
DropdownMenuItemComponent.LeadingIcon = LeadingIcon;
DropdownMenuItemComponent.TrailingIcon = TrailingIcon;

export { DropdownMenuItemComponent as DropdownMenuItem };
