import { requireNativeView } from 'expo';
import { ReactNode } from 'react';
import { StyleProp, ViewStyle, type ColorValue } from 'react-native';

import { ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

const MenuNativeView: React.ComponentType<NativeMenuProps> = requireNativeView(
  'ExpoUI',
  'ContextMenuView'
);

// TODO: Extract into separate SlotView similar to swift-ui
const SlotNativeView: React.ComponentType<{
  slotName: string;
  children: React.ReactNode;
}> = requireNativeView('ExpoUI', 'SlotView');

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
   * Whether the context menu is expanded (visible).
   */
  expanded?: boolean;

  /**
   * Callback fired when the menu requests to be dismissed (e.g. tapping outside).
   * Must be provided when `expanded` is `true` to allow the menu to close.
   */
  onDismissRequest?: () => void;

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

type NativeMenuProps = {
  expanded?: boolean;
  onDismissRequest?: () => void;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
  modifiers?: ModifierConfig[];
  children?: ReactNode;
};

/**
 * Container for items displayed in the context menu dropdown.
 * Children should be `DropdownMenuItem` components or other native views.
 */
export function Items(props: { children: ReactNode }) {
  return <SlotNativeView slotName="items">{props.children}</SlotNativeView>;
}
Items.tag = 'Items';

/**
 * Container for the trigger element that opens the context menu.
 */
export function Trigger(props: { children: ReactNode }) {
  return <>{props.children}</>;
}
Trigger.tag = 'Trigger';

/**
 * Preview content shown during long press (iOS only).
 */
export function Preview(props: { children: ReactNode }) {
  return <></>;
}

function ContextMenu(props: ContextMenuProps) {
  const { modifiers, ...restProps } = props;
  return (
    <MenuNativeView
      style={props.style}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {props.children}
    </MenuNativeView>
  );
}

ContextMenu.Trigger = Trigger;
ContextMenu.Preview = Preview;
ContextMenu.Items = Items;

export { ContextMenu };
export { DropdownMenuItem } from './DropdownMenuItem';
