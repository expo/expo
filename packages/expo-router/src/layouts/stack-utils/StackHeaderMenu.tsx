import type {
  NativeStackHeaderItemMenu,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from '@react-navigation/native-stack';
import { Children, type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from './shared';
import { isChildOfType } from './utils';
import { Menu, MenuAction } from '../../primitives';

export interface StackHeaderMenuProps extends StackHeaderItemSharedProps {
  // TODO
  changesSelectionAsPrimaryAction?: boolean;
  /**
   * Optional title to show on top of the menu.
   */
  title?: string;
}

export const StackHeaderMenu: React.FC<StackHeaderMenuProps> = Menu;

export function convertStackHeaderMenuPropsToRNHeaderItem(
  props: StackHeaderMenuProps
): NativeStackHeaderItemMenu {
  const { title, ...rest } = props;
  const actions = Children.toArray(props.children).filter(
    (child) => isChildOfType(child, StackHeaderMenuAction) || isChildOfType(child, StackHeaderMenu)
  );
  const item: NativeStackHeaderItemMenu = {
    ...convertStackHeaderSharedPropsToRNSharedHeaderItem(rest),
    type: 'menu',
    menu: {
      items: actions.map((action) => {
        if (isChildOfType(action, StackHeaderMenu)) {
          return convertStackHeaderSubmenuMenuPropsToRNHeaderItem(action.props);
        }
        return convertStackHeaderMenuActionPropsToRNHeaderItem(action.props);
      }),
    },
  };
  if (title) {
    item.menu.title = title;
  }

  return item;
}

const SUBMENU_UNSUPPORTED_PROPS = ['title'] as const;

function convertStackHeaderSubmenuMenuPropsToRNHeaderItem(
  props: StackHeaderMenuProps
): NativeStackHeaderItemMenuSubmenu {
  // Removing children. Otherwise the buttons will be broken
  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props);
  const actions = Children.toArray(props.children).filter(
    (child) => isChildOfType(child, StackHeaderMenuAction) || isChildOfType(child, StackHeaderMenu)
  );

  if (process.env.NODE_ENV !== 'production') {
    for (const unsupportedProp of SUBMENU_UNSUPPORTED_PROPS) {
      if (unsupportedProp in props) {
        console.warn(
          `Warning: The prop "${unsupportedProp}" is not supported on Stack.Header.Menu used as a submenu.`
        );
      }
    }
  }

  const item: NativeStackHeaderItemMenuSubmenu = {
    type: 'submenu',
    items: actions.map((action) => {
      if (isChildOfType(action, StackHeaderMenu)) {
        return convertStackHeaderSubmenuMenuPropsToRNHeaderItem(action.props);
      }
      return convertStackHeaderMenuActionPropsToRNHeaderItem(action.props);
    }),
    label: sharedProps.label,
  };

  if (sharedProps.icon) {
    // Only SF Symbols are supported in submenu icons
    if (sharedProps.icon.type === 'sfSymbol') {
      item.icon = sharedProps.icon;
    } else {
      console.warn(
        'When Icon is used inside Stack.Header.Menu used as a submenu, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    }
  }

  return item;
}

export interface StackHeaderMenuActionProps {
  /**
   * Can be an Icon or Label
   */
  children?: ReactNode;
  /**
   * If `true`, the menu item will be disabled and not selectable.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
   */
  disabled?: boolean;
  icon?: SFSymbol | ImageSourcePropType;
  /**
   * If `true`, the menu item will be displayed as destructive.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
   */
  destructive?: boolean;
  /**
   * If `true`, the menu will be kept presented after the action is selected.
   *
   * This is marked as unstable, because when action is selected it will recreate the menu,
   * which will close all opened submenus and reset the scroll position.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented) for more information.
   */
  unstable_keepPresented?: boolean;
  /**
   * If `true`, the menu item will be displayed as selected.
   */
  isOn?: boolean;
  onPress?: () => void;
  /**
   * An elaborated title that explains the purpose of the action.
   */
  discoverabilityLabel?: string;
  hidden?: boolean;
}

export const StackHeaderMenuAction: React.FC<StackHeaderMenuActionProps> = MenuAction;

export function convertStackHeaderMenuActionPropsToRNHeaderItem(
  props: StackHeaderMenuActionProps
): NativeStackHeaderItemMenuAction {
  const { children, isOn, unstable_keepPresented, icon, ...rest } = props;
  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props);
  const item: NativeStackHeaderItemMenuAction = {
    ...rest,
    type: 'action',
    label: sharedProps.label,
    state: isOn ? 'on' : 'off',
    onPress: props.onPress ?? (() => {}),
  };
  if (unstable_keepPresented !== undefined) {
    item.keepsMenuPresented = unstable_keepPresented;
  }
  if (sharedProps.icon) {
    // Only SF Symbols are supported in action icons
    if (sharedProps.icon.type === 'sfSymbol') {
      item.icon = sharedProps.icon;
    } else {
      console.warn(
        'When Icon is used inside Stack.Header.Menu.Action, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    }
  }
  return item;
}
