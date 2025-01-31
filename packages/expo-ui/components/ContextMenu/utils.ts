import { Children, isValidElement, ReactElement, ReactNode } from 'react';

import { ContextMenuElementBase, EventHandlers, Submenu, SubmenuProps } from './index';
import { Button, ButtonProps, NativeButtonProps, transformButtonProps } from '../Button';
import { Picker, PickerProps } from '../Picker';
import { Switch, SwitchProps } from '../Switch';

// We use this slightly odd typing for the elements to make unpacking the elements easier on the native side
type ButtonMenuElement = {
  button: NativeButtonProps;
} & ContextMenuElementBase;

type SwitchMenuElement = {
  switch: SwitchProps;
} & ContextMenuElementBase;

type PickerMenuElement = {
  picker: PickerProps;
} & ContextMenuElementBase;

type SubmenuElement = {
  submenu: {
    elements: MenuElement[];
    button: NativeButtonProps;
  };
} & ContextMenuElementBase;

export type MenuElement =
  | ButtonMenuElement
  | SwitchMenuElement
  | PickerMenuElement
  | SubmenuElement;

// Maps the react children to NativeMenuElement[] which is used to render out the native menu
// TODO: Ideally we want to pass the children directly to the native side without having to do this
export function transformChildrenToElementArray(
  children: ReactNode,
  eventHandlersMap: EventHandlers
): MenuElement[] {
  return Children.toArray(children)
    .map((child) => processChildElement(child, eventHandlersMap))
    .filter((el): el is MenuElement => el !== null);
}

function processChildElement(
  child: ReactNode,
  eventHandlersMap: EventHandlers
): MenuElement | null {
  if (!isValidElement(child)) return null;

  const uuid = expo.uuidv4();

  if (child.type === Button) {
    return createButtonElement(uuid, child.props, eventHandlersMap);
  }

  if (child.type === Switch) {
    return createSwitchElement(uuid, child.props, eventHandlersMap);
  }

  if (child.type === Picker) {
    return createPickerElement(uuid, child.props, eventHandlersMap);
  }

  if (isSubmenuComponent(child)) {
    return createSubmenuElement(uuid, child.props, eventHandlersMap);
  }

  console.warn('Unsupported child type in Menu: ', child.type);
  return null;
}

function createButtonElement(
  uuid: string,
  props: ButtonProps,
  handlers: EventHandlers
): MenuElement {
  if (props.onPress) {
    handlers[uuid] = { onPress: props.onPress };
  }

  return {
    contextMenuElementID: uuid,
    button: transformButtonProps(props),
  };
}

function createSwitchElement(
  uuid: string,
  props: SwitchProps,
  handlers: EventHandlers
): MenuElement {
  if (props.onCheckedChanged) {
    handlers[uuid] = { onCheckedChanged: props.onCheckedChanged };
  }

  return {
    contextMenuElementID: uuid,
    switch: props,
  };
}

function createPickerElement(
  uuid: string,
  props: PickerProps,
  handlers: EventHandlers
): MenuElement {
  if (props.onOptionSelected) {
    handlers[uuid] = { onOptionSelected: props.onOptionSelected };
  }

  return {
    contextMenuElementID: uuid,
    picker: props,
  };
}

function createSubmenuElement(
  uuid: string,
  props: SubmenuProps,
  handlers: EventHandlers
): MenuElement {
  return {
    contextMenuElementID: uuid,
    submenu: {
      button: transformButtonProps(props.button.props),
      elements: transformChildrenToElementArray(props.children, handlers),
    },
  };
}

function isSubmenuComponent(child: ReactElement): boolean {
  return child.type.toString() === Submenu.toString();
}
