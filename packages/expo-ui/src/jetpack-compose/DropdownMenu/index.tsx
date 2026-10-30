import { requireNativeView } from 'expo';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ColorValue } from 'react-native';

import { PresentedContent } from '../../PresentedContentContext';
import type { ModifierConfig, PopupProperties } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

const MenuNativeView: React.ComponentType<NativeMenuProps> = requireNativeView(
  'ExpoUI',
  'DropdownMenuView'
);

const MenuPopupNativeView: React.ComponentType<NativeMenuPopupProps> = requireNativeView(
  'ExpoUI',
  'DropdownMenuPopupView'
);

const MenuGroupNativeView: React.ComponentType<DropdownMenuGroupProps> = requireNativeView(
  'ExpoUI',
  'DropdownMenuGroupView'
);

// TODO: Extract into separate SlotView similar to swift-ui
const SlotNativeView: React.ComponentType<{
  slotName: string;
  children: React.ReactNode;
}> = requireNativeView('ExpoUI', 'SlotView');

/**
 * Props of the `DropdownMenu` component.
 */
export interface DropdownMenuProps {
  /**
   * The contents of the submenu are used as an anchor for the dropdown menu.
   * The children will be wrapped in a pressable element, which triggers opening of the dropdown menu.
   */
  children: ReactNode;

  /**
   * Whether the dropdown menu is expanded (visible).
   */
  expanded?: boolean;

  /**
   * Callback fired when the menu requests to be dismissed (e.g. tapping outside).
   * Must be provided when `expanded` is `true` to allow the menu to close.
   */
  onDismissRequest?: () => void;

  /**
   * The color of the container holding the dropdown menu items.
   */
  color?: ColorValue;

  /**
   * Corner radius in dp for the dropdown menu container. Defaults to the Material3
   * `MenuDefaults.shape` corner radius.
   *
   * @platform android
   */
  cornerRadius?: number;

  /**
   * Shadow elevation of the dropdown menu popup in dp. Set to `0` to remove the shadow.
   * Defaults to Material3's `MenuDefaults.ShadowElevation`.
   *
   * @platform android
   */
  shadowElevation?: number;

  /**
   * Properties for the popup window of the dropdown menu.
   *
   * @platform android
   */
  properties?: PopupProperties;

  /**
   * Optional styles to apply to the `DropdownMenu`.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
}

type NativeMenuProps = {
  expanded?: boolean;
  onDismissRequest?: () => void;
  color?: ColorValue;
  cornerRadius?: number;
  shadowElevation?: number;
  properties?: PopupProperties;
  style?: StyleProp<ViewStyle>;
  modifiers?: ModifierConfig[];
  children?: ReactNode;
};

/**
 * The position of a group in a `DropdownMenuPopup`, or of an item in a group.
 * Compose's `MenuDefaults.groupShape(index, count)` and `MenuDefaults.itemShape(index, count)` use
 * it to round the outer corners of the first and last element.
 */
export type MenuShapePosition = {
  /**
   * The index of the group in the menu, or of the item in its group.
   */
  index: number;
  /**
   * The number of groups in the menu, or of items in the group.
   */
  count: number;
};

/**
 * Props of the `DropdownMenuPopup` component.
 */
export interface DropdownMenuPopupProps {
  /**
   * The contents of the menu, typically `DropdownMenuGroup` components.
   */
  children: ReactNode;

  /**
   * Whether the menu is expanded (visible).
   */
  expanded?: boolean;

  /**
   * Callback fired when the menu requests to be dismissed (for example, tapping outside).
   * Must be provided when `expanded` is `true` to allow the menu to close.
   */
  onDismissRequest?: () => void;

  /**
   * Properties for the popup window of the menu.
   */
  properties?: PopupProperties;

  /**
   * Modifiers for the contents of the menu.
   */
  modifiers?: ModifierConfig[];
}

type NativeMenuPopupProps = {
  expanded?: boolean;
  onDismissRequest?: () => void;
  properties?: PopupProperties;
  modifiers?: ModifierConfig[];
  children?: ReactNode;
};

/**
 * Props of the `DropdownMenuGroup` component.
 */
export interface DropdownMenuGroupProps {
  /**
   * The contents of the group, typically `DropdownMenuItem` or `SelectableDropdownMenuItem`
   * components.
   */
  children: ReactNode;

  /**
   * The position of the group in the menu, which sets its shape through Compose's
   * `MenuDefaults.groupShape(index, count)`. Defaults to `MenuDefaults.groupShapes()`, the shape
   * of a single group.
   */
  shapes?: MenuShapePosition;

  /**
   * The container color of the group. Defaults to `MenuDefaults.groupStandardContainerColor`.
   */
  containerColor?: ColorValue;

  /**
   * Tonal elevation of the group in dp. Defaults to `MenuDefaults.TonalElevation`.
   */
  tonalElevation?: number;

  /**
   * Shadow elevation of the group in dp. Defaults to `MenuDefaults.ShadowElevation`.
   */
  shadowElevation?: number;

  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
}

/**
 * Container for items displayed in the dropdown menu.
 * Children should be `DropdownMenuItem` components or other native views.
 */
export function Items(props: { children: ReactNode }) {
  // The items are presented in their own popup window; the trigger stays in the React Native surface.
  return (
    <SlotNativeView slotName="items">
      <PresentedContent>{props.children}</PresentedContent>
    </SlotNativeView>
  );
}
Items.tag = 'Items';

/**
 * Container for the trigger element that opens the dropdown menu.
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

function DropdownMenu(props: DropdownMenuProps) {
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

DropdownMenu.Trigger = Trigger;
DropdownMenu.Preview = Preview;
DropdownMenu.Items = Items;

export { DropdownMenu };

/**
 * A Material 3 Expressive menu that wraps Compose's `DropdownMenuPopup`. The menu anchors to its
 * parent, so it goes in a `Box` next to the component that opens it. Unlike `DropdownMenu`, it
 * has no container. It holds `DropdownMenuGroup` components, with a `Spacer` between the groups.
 *
 * @platform android
 */
export function DropdownMenuPopup(props: DropdownMenuPopupProps) {
  const { modifiers, children, ...restProps } = props;
  return (
    <MenuPopupNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {/* The menu is a popup in its own window. The anchor stays in the React Native surface. */}
      <PresentedContent>{children}</PresentedContent>
    </MenuPopupNativeView>
  );
}

/**
 * A group of menu items that wraps Compose's `DropdownMenuGroup`, for use in a
 * `DropdownMenuPopup`.
 *
 * @platform android
 */
export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  const { modifiers, ...restProps } = props;
  return (
    <MenuGroupNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

export { DropdownMenuItem } from './DropdownMenuItem';
export type { DropdownMenuItemProps, DropdownMenuItemElementColors } from './DropdownMenuItem';
export { SelectableDropdownMenuItem } from './SelectableDropdownMenuItem';
export type {
  SelectableDropdownMenuItemProps,
  SelectableDropdownMenuItemColors,
} from './SelectableDropdownMenuItem';

// Re-exported so the docs generator includes PopupProperties on the DropdownMenu API page.
export type { PopupProperties };
