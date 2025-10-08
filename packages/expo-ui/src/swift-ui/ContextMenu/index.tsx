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
 * Items visible inside the context menu. Pass input components as immidiate children of the tag.
 * `Button`, `Switch` and `Submenu` components are supported on both Android and iOS.
 * The `Picker` component is supported only on iOS. Remember to use components from the `@expo/ui` library.
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
 * @platform ios
 */
export function Preview(props: { children: React.ReactNode }) {
  return <MenuNativePreviewView {...props} />;
}

/**
 * `<ContextMenu>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */

/**
 * `ContextMenu` allows you to create a context menu, which can be used to provide additional options to the user.
 *
 * There are some platform-specific differences in the behavior of the context menu:
 * - On Android, the expansion of the context menu is controlled by the `expanded` prop. iOS, does not allow for manual control of the expansion state.
 * - On iOS, the context menu can be triggered by a single press or a long press. The `activationMethod` prop allows you to choose between these two options.
 * - Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple sections. The `title` prop of the `Button`, which opens the submenu on iOS will be used as a section title.
 * - Android does not support showing a `Picker` element in the context menu.
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
