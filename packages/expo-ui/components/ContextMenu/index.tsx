import { requireNativeView } from 'expo';
import React, { ReactElement, ReactNode, useMemo } from 'react';
import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

import { ButtonProps } from '../Button';
import { PickerProps } from '../Picker';
import { SwitchProps } from '../Switch';
import { MenuElement, transformChildrenToElementArray } from './utils';

type SubmenuElement =
  | ReactElement<ButtonProps>
  | ReactElement<SwitchProps>
  | ReactElement<PickerProps>
  | ReactElement<SubmenuProps>;

type ContentChildren = SubmenuElement | SubmenuElement[];

export type ContextMenuContentProps = {
  children: ContentChildren;
};

export type EventHandlers = {
  [key: string]: {
    [key: string]: (event: NativeSyntheticEvent<any>) => void;
  };
};

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
   * Items visible inside the context menu. The items should be wrapped in a `React.Fragment`.
   * `Button`, `Switch` and `Submenu` components are supported on both Android and iOS.
   * The `Picker` component is supported only on iOS. Remember to use components from the `@expo/ui` library.
   */
  Items: React.ReactElement<ContextMenuContentProps>;

  /**
   * Determines how the context menu will be activated.
   *
   * @platform ios
   */
  activationMethod?: ActivationMethod;

  /**
   * The contents of the submenu are used as an anchor for the context menu.
   * The children will be wrapped in a pressable element, which triggers opening of the context menu.
   */
  children: ReactNode;

  /**
   * Optional styles to apply to the `ContextMenu`
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Props of the `Submenu` component.
 */
export type SubmenuProps = {
  /**
   * The button that will be used to expand the submenu. On Android the `text` prop of the `Button` will be used as a section title.
   */
  button: React.ReactElement<ButtonProps>;
  /**
   * Children of the submenu. Only `Button`, `Switch`, `Picker` and `Submenu` elements should be used.
   */
  children: React.ReactNode;
};

type NativeMenuProps = ContextMenuProps & {
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

const MenuNativeView: React.ComponentType<NativeMenuProps> = requireNativeView(
  'ExpoUI',
  'ContextMenu'
);

/**
 * The `Submenu` component is used to create a nested context menu. Submenus can be infinitely nested.
 * Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple titled sections.
 */
export function Submenu(props: SubmenuProps) {
  return <></>;
}

/**
 * `ContextMenu` allows you to create a context menu, which can be used to provide additional options to the user.
 *
 * There are some platform-specific differences in the behavior of the context menu:
 * - On Android the expansion of the context menu is controlled by the (`expanded`)[#expanded] prop, iOS does not allow for manual control of the expansion state.
 * - On iOS the context menu can be triggered by a single press or a long press. The `activationMethod` prop allows you to choose between these two options.
 * - Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple sections. The `title` prop of the `Button`, which opens the submenu on iOS will be used as a section title.
 * - Android does not support showing a `Picker` element in the context menu.
 */
export function ContextMenu(props: ContextMenuProps) {
  const eventHandlersMap: EventHandlers = {};
  const initialChildren = props.Items.props.children;
  const processedElements = useMemo(
    () => transformChildrenToElementArray(initialChildren, eventHandlersMap),
    [initialChildren]
  );

  const createEventHandler =
    (handlerType: string) => (e: NativeSyntheticEvent<{ contextMenuElementID: string }>) => {
      const handler = eventHandlersMap[e.nativeEvent.contextMenuElementID]?.[handlerType];
      handler?.(e);
    };

  return (
    <MenuNativeView
      style={props.style}
      elements={processedElements}
      onContextMenuButtonPressed={createEventHandler('onPress')}
      onContextMenuSwitchValueChanged={createEventHandler('onValueChange')}
      onContextMenuPickerOptionSelected={createEventHandler('onOptionSelected')}
      {...props}
    />
  );
}
