import { requireNativeView } from 'expo';
import { ComponentType, Children, ReactElement, ReactNode, useMemo } from 'react';
import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

import { Host } from '../Host';
import { MenuElement, transformChildrenToElementArray } from './utils';
import { ButtonProps } from '../Button';
import { PickerProps } from '../Picker';
import { SwitchProps } from '../Switch';

const MenuNativeView: ComponentType<NativeMenuProps> = requireNativeView('ExpoUI', 'ContextMenu');

const MenuNativeTriggerView: ComponentType<object> = requireNativeView(
  'ExpoUI',
  'ContextMenuActivationElement'
);

const MenuNativePreviewView: ComponentType<object> = requireNativeView(
  'ExpoUI',
  'ContextMenuPreview'
);

type SubmenuElement =
  | ReactElement<ButtonProps>
  | ReactElement<SwitchProps>
  | ReactElement<PickerProps>
  | ReactElement<SubmenuProps>;

export type ContextMenuContentProps = {
  children: SubmenuElement | SubmenuElement[];
};

/**
 * @hidden
 */
export type EventHandlers = Record<
  string,
  Record<string, (event: NativeSyntheticEvent<any>) => void>
>;

/**
 * @hidden
 */
export type ContextMenuElementBase = { contextMenuElementID: string };

/**
 * Activation method of the context menu.
 * - `singlePress`: The context menu is opened with a single tap. Does not isolate the content.
 * - `longPress`: The context menu is opened with a long press. On iOS additionally Highlights the content by blurring the background.
 */
export type ActivationMethod = 'singlePress' | 'longPress';

/**
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
  /**
   * Determines how the context menu will be activated.
   */
  activationMethod?: ActivationMethod;

  /**
   * The contents of the submenu are used as an anchor for the context menu.
   * The children will be wrapped in a pressable element, which triggers opening of the context menu.
   */
  children: ReactNode;
};

/**
 * Props of the `Submenu` component.
 */
export type SubmenuProps = {
  /**
   * The button that will be used to expand the submenu. On Android the `text` prop of the `Button` will be used as a section title.
   */
  button: ReactElement<ButtonProps>;
  /**
   * Children of the submenu. Only `Button`, `Switch`, `Picker` and `Submenu` elements should be used.
   */
  children: ReactNode;
};

/**
 * @hidden
 */
export type NativeMenuProps = ContextMenuProps & {
  elements: MenuElement[];
  onContextMenuButtonPressed: (
    event: NativeSyntheticEvent<{ contextMenuElementID: string }>
  ) => void;
  onContextMenuSwitchValueChanged: (
    event: NativeSyntheticEvent<{
      contextMenuElementID: string;
      value: boolean;
    }>
  ) => void;
  onContextMenuPickerOptionSelected: (
    event: NativeSyntheticEvent<{
      index: number;
      label: string;
      contextMenuElementID: string;
    }>
  ) => void;
};

/**
 * The `Submenu` component is used to create a nested context menu. Submenus can be infinitely nested.
 * Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple titled sections.
 */
export function Submenu(props: SubmenuProps) {
  return <></>;
}

/**
 * Items visible inside the context menu. Pass input components as immidiate children of the tag.
 * `Button`, `Switch` and `Submenu` components are supported on both Android and iOS.
 * The `Picker` component is supported only on iOS. Remember to use components from the `@expo/ui` library.
 */
export function Items(props: { children: React.ReactNode }) {
  return <></>;
}
Items.tag = 'Items';

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
function ContextMenuPrimitive(props: ContextMenuProps) {
  const eventHandlersMap: EventHandlers = {};
  const initialChildren = Children.map(
    props.children as any,
    (c: { type: { tag: string }; props: { children: React.ReactNode } }) =>
      c.type.tag === Items.tag ? c.props.children : null
  );
  const processedElements = useMemo(
    () => transformChildrenToElementArray(initialChildren, eventHandlersMap),
    [initialChildren]
  );

  const createEventHandler =
    (handlerType: string) => (event: NativeSyntheticEvent<{ contextMenuElementID: string }>) => {
      const handler = eventHandlersMap[event.nativeEvent.contextMenuElementID]?.[handlerType];
      handler?.(event);
    };

  return (
    <MenuNativeView
      elements={processedElements}
      onContextMenuButtonPressed={createEventHandler('onPress')}
      onContextMenuSwitchValueChanged={createEventHandler('onValueChange')}
      onContextMenuPickerOptionSelected={createEventHandler('onOptionSelected')}
      {...props}
    />
  );
}

/**
 * `ContextMenuPrimitive` allows you to create a context menu, which can be used to provide additional options to the user.
 *
 * There are some platform-specific differences in the behavior of the context menu:
 * - On Android, the expansion of the context menu is controlled by the `expanded` prop. iOS, does not allow for manual control of the expansion state.
 * - On iOS, the context menu can be triggered by a single press or a long press. The `activationMethod` prop allows you to choose between these two options.
 * - Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple sections. The `title` prop of the `Button`, which opens the submenu on iOS will be used as a section title.
 * - Android does not support showing a `Picker` element in the context menu.
 */
function ContextMenu(props: ContextMenuProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <ContextMenuPrimitive {...props} />
    </Host>
  );
}

ContextMenuPrimitive.Trigger = Trigger;
ContextMenuPrimitive.Preview = Preview;
ContextMenuPrimitive.Items = Items;
ContextMenu.Trigger = Trigger;
ContextMenu.Preview = Preview;
ContextMenu.Items = Items;

export { ContextMenuPrimitive, ContextMenu };
