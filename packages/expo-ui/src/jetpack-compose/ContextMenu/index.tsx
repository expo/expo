import { requireNativeView } from 'expo';
import { Children, ReactElement, ReactNode, useMemo } from 'react';
import { NativeSyntheticEvent, StyleProp, ViewStyle, type ColorValue } from 'react-native';

import { SubmenuProps } from './Submenu';
import { MenuElement, transformChildrenToElementArray } from './utils';
import { ModifierConfig } from '../../types';
import { ButtonProps } from '../Button';
import { PickerProps } from '../Picker';
import { SwitchProps } from '../Switch';

const MenuNativeView: React.ComponentType<NativeMenuProps> = requireNativeView(
  'ExpoUI',
  'ContextMenuView'
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
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
  /**
   * The contents of the submenu are used as an anchor for the context menu.
   * The children will be wrapped in a pressable element, which triggers opening of the context menu.
   */
  children: ReactNode;

  /**
   * The color of the container holding the context menu items.
   */
  color?: ColorValue;

  /**
   * Optional styles to apply to the `ContextMenu`.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

/**
 * @hidden
 */
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

export function Items(props: ContextMenuContentProps) {
  return <></>;
}
Items.tag = 'Items';

export function Trigger(props: { children: React.ReactNode }) {
  return <></>;
}
Trigger.tag = 'Trigger';

export function Preview(props: { children: React.ReactNode }) {
  return <></>;
}

function ContextMenu(props: ContextMenuProps) {
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

  const activationElement = Children.map(
    props.children as any,
    (c: { type: { tag: string }; props: { children: React.ReactNode } }) =>
      c.type.tag === Trigger.tag ? c.props.children : null
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
      modifiers={props.modifiers}
      {...props}>
      {activationElement}
    </MenuNativeView>
  );
}

ContextMenu.Trigger = Trigger;
ContextMenu.Preview = Preview;
ContextMenu.Items = Items;

export { ContextMenu };
export { Submenu } from './Submenu';
