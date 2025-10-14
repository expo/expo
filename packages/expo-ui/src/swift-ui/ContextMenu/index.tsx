import { requireNativeView } from 'expo';
import { ComponentType } from 'react';

import { type SubmenuProps, type ContextMenuProps } from './types';

export { type ActivationMethod, type ContextMenuProps } from './types';

const MenuNativeView: ComponentType<NativeMenuProps> = requireNativeView('ExpoUI', 'ContextMenu');

const MenuNativeTriggerView: ComponentType<object> = requireNativeView(
  'ExpoUI',
  'ContextMenuActivationElement'
);

const MenuNativePreviewView: ComponentType<object> = requireNativeView(
  'ExpoUI',
  'ContextMenuPreview'
);

const MenuNativeItemsView: ComponentType<object> = requireNativeView(
  'ExpoUI',
  'ContextMenuContent'
);

type NativeMenuProps = ContextMenuProps;

/**
 * Items visible inside the context menu. It could be `Section`, `Divider`, `Button`, `Switch`, `Picker` or even `ContextMenu` itself for nested menus. Remember to use components from the `@expo/ui/swift-ui` library.
 */
export function Items(props: { children: React.ReactNode }) {
  return <MenuNativeItemsView {...props} />;
}

/**
 * The component visible all the time that triggers the menu when tapped or long-pressed.
 */
export function Trigger(props: { children: React.ReactNode }) {
  return <MenuNativeTriggerView {...props} />;
}

/**
 * The component visible above the menu when it is opened.
 */
export function Preview(props: { children: React.ReactNode }) {
  return <MenuNativePreviewView {...props} />;
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

/**
 * @deprecated Use `ContextMenu` component as Submenu instead.
 */
const Submenu = (props: SubmenuProps) => {
  const { button, children, ...rest } = props;
  return (
    <ContextMenu {...rest}>
      <ContextMenu.Items>{children}</ContextMenu.Items>
      <ContextMenu.Trigger>{button}</ContextMenu.Trigger>
    </ContextMenu>
  );
};

export { ContextMenu, Submenu };
