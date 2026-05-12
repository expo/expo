import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';

import type { ContextMenuProps } from './types';
import { Slot } from '../SlotView';

export { type ContextMenuProps } from './types';

type NativeMenuProps = ContextMenuProps;

const MenuNativeView: ComponentType<NativeMenuProps> = requireNativeView('ExpoUI', 'ContextMenu');

/**
 * Items visible inside the context menu. It could be `Section`, `Divider`, `Button`, `Toggle`, `Picker` or even `ContextMenu` itself for nested menus. Remember to use components from the `@expo/ui/swift-ui` library.
 */
export function Items(props: { children: React.ReactNode }) {
  return <Slot name="items">{props.children}</Slot>;
}

/**
 * The component visible all the time that triggers the context menu when long-pressed.
 */
export function Trigger(props: { children: React.ReactNode }) {
  return <Slot name="trigger">{props.children}</Slot>;
}

/**
 * The component visible above the menu when it is opened.
 */
export function Preview(props: { children: React.ReactNode }) {
  return <Slot name="preview">{props.children}</Slot>;
}

/**
 * `ContextMenu` allows you to create a context menu, which can be used to provide additional options to the user.
 */
function ContextMenu(props: ContextMenuProps) {
  return <MenuNativeView {...props} />;
}

ContextMenu.Trigger = Trigger;
ContextMenu.Preview = Preview;
ContextMenu.Items = Items;

export { ContextMenu };
