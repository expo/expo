'use client';
import type {
  NativeStackHeaderItemMenu,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import { Children, useMemo, type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { HeaderBarButtonItemSubmenu } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';

import { NativeToolbarMenu, NativeToolbarMenuAction } from './bottom-toolbar-native-elements';
import { useToolbarPlacement } from './context';
import { Menu, MenuAction } from '../../../primitives';
import { filterAllowedChildrenElements, isChildOfType } from '../../../utils/children';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from '../shared';

export interface StackToolbarMenuProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * Menu content - can include icons, labels, badges and menu actions.
   *
   * @example
   * ```tsx
   * <Stack.Toolbar.Menu>
   *   <Stack.Toolbar.Icon sfSymbol="ellipsis.circle" />
   *   <Stack.Toolbar.Label>Options</Stack.Toolbar.Label>
   *   <Stack.Toolbar.MenuAction onPress={() => {}}>Action 1</Stack.Toolbar.MenuAction>
   * </Stack.Toolbar.Menu>
   * ```
   */
  children?: ReactNode;
  /**
   * If `true`, the menu item will be displayed as destructive.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
   */
  destructive?: boolean;
  disabled?: boolean;
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display for the menu item.
   *
   * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
   */
  image?: ImageRef;
  /**
   * Whether to hide the shared background.
   *
   * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  /**
   * Whether the menu should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Icon for the menu item.
   *
   * Can be an SF Symbol name or an image source.
   *
   * > **Note**: When used in `placement="bottom"`, only string SFSymbols are supported. Use the `image` prop to provide custom images.
   */
  icon?: StackHeaderItemSharedProps['icon'];
  /**
   * If `true`, the menu will be displayed inline.
   * This means that the menu will not be collapsed
   *
   * > **Note**: Inline menus are only supported in submenus.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
   */
  inline?: boolean;
  /**
   * If `true`, the menu will be displayed as a palette.
   * This means that the menu will be displayed as one row
   *
   * > **Note**: Palette menus are only supported in submenus.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
   */
  palette?: boolean;
  /**
   * Whether to separate the background of this item from other header items.
   *
   * @default false
   */
  separateBackground?: boolean;
  /**
   * Style for the label of the header item.
   */
  style?: StackHeaderItemSharedProps['style'];
  /**
   * The tint color to apply to the button item
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
   */
  tintColor?: StackHeaderItemSharedProps['tintColor'];
  /**
   * Optional title to show on top of the menu.
   */
  title?: string;
  /**
   * @default 'plain'
   */
  variant?: StackHeaderItemSharedProps['variant'];
  // TODO(@ubax): Add elementSize support in react-native-screens for header menus.
  /**
   * The preferred size of the menu elements.
   *
   * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/preferredelementsize) for more information.
   *
   * @platform iOS 16.0+
   */
  elementSize?: 'auto' | 'small' | 'medium' | 'large';
}

/**
 * Use as `Stack.Toolbar.Menu` to provide menus in iOS toolbar.
 * It accepts `Stack.Toolbar.MenuAction` and nested `Stack.Toolbar.Menu`
 * elements. Menu can be configured using both component props and child
 * elements.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Alert } from 'react-native';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="right">
 *         <Stack.Toolbar.Menu icon="ellipsis.circle">
 *           <Stack.Toolbar.MenuAction onPress={() => Alert.alert('Action pressed!')}>
 *             Action 1
 *           </Stack.Toolbar.MenuAction>
 *         </Stack.Toolbar.Menu>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
export const StackToolbarMenu: React.FC<StackToolbarMenuProps> = ({ children, ...props }) => {
  const placement = useToolbarPlacement();

  const allowedChildren = useMemo(
    () =>
      placement === 'bottom'
        ? [StackToolbarMenu, StackToolbarMenuAction, NativeToolbarMenu, NativeToolbarMenuAction]
        : [StackToolbarMenu, StackToolbarMenuAction],
    [placement]
  );

  const validChildren = useMemo(
    () => filterAllowedChildrenElements(children, allowedChildren),
    [children, allowedChildren]
  );

  if (process.env.NODE_ENV !== 'production') {
    const allChildren = Children.toArray(children);
    if (allChildren.length !== validChildren.length) {
      throw new Error(
        `Stack.Toolbar.Menu only accepts Stack.Toolbar.Menu and Stack.Toolbar.MenuAction as its children.`
      );
    }
  }

  if (placement === 'bottom') {
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    return <NativeToolbarMenu {...props} image={props.image} children={validChildren} />;
  }

  return <Menu {...props} children={validChildren} />;
};

export function convertStackToolbarMenuPropsToRNHeaderItem(
  props: StackToolbarMenuProps
): NativeStackHeaderItemMenu | undefined {
  if (props.hidden) {
    return undefined;
  }
  const { title, ...rest } = props;
  const actions = Children.toArray(props.children).filter(
    (child) =>
      isChildOfType(child, StackToolbarMenuAction) || isChildOfType(child, StackToolbarMenu)
  );
  const item: NativeStackHeaderItemMenu = {
    ...convertStackHeaderSharedPropsToRNSharedHeaderItem(rest),
    type: 'menu',
    menu: {
      items: actions
        .map((action) => {
          if (isChildOfType(action, StackToolbarMenu)) {
            return convertStackToolbarSubmenuMenuPropsToRNHeaderItem(action.props);
          }
          return convertStackToolbarMenuActionPropsToRNHeaderItem(action.props);
        })
        .filter((i) => !!i),
    },
  };
  if (title) {
    item.menu.title = title;
  }

  return item;
}

function convertStackToolbarSubmenuMenuPropsToRNHeaderItem(
  props: StackToolbarMenuProps
): NativeStackHeaderItemMenuSubmenu | undefined {
  if (props.hidden) {
    return undefined;
  }
  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props);
  const actions = Children.toArray(props.children).filter(
    (child) =>
      isChildOfType(child, StackToolbarMenuAction) || isChildOfType(child, StackToolbarMenu)
  );

  // TODO: Remove  Pick<HeaderBarButtonItemSubmenu> when this PR is merged and released in react-navigation:
  // https://github.com/react-navigation/react-navigation/pull/12895
  const item: NativeStackHeaderItemMenuSubmenu &
    Pick<HeaderBarButtonItemSubmenu, 'displayAsPalette' | 'displayInline' | 'destructive'> = {
    type: 'submenu',
    items: actions
      .map((action) => {
        if (isChildOfType(action, StackToolbarMenu)) {
          return convertStackToolbarSubmenuMenuPropsToRNHeaderItem(action.props);
        }
        return convertStackToolbarMenuActionPropsToRNHeaderItem(action.props);
      })
      .filter((i) => !!i),
    label: sharedProps.label || props.title || '',
  };

  if (props.inline !== undefined) {
    item.displayInline = props.inline;
  }
  if (props.palette !== undefined) {
    item.displayAsPalette = props.palette;
  }
  if (props.destructive !== undefined) {
    item.destructive = props.destructive;
  }
  // TODO: Add elementSize to react-native-screens

  if (sharedProps.icon) {
    // Only SF Symbols are supported in submenu icons
    // TODO(@ubax): Add support for other images in react-native-screens
    if (sharedProps.icon.type === 'sfSymbol') {
      item.icon = sharedProps.icon;
    } else {
      console.warn(
        'When Icon is used inside Stack.Toolbar.Menu used as a submenu, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    }
  }

  return item;
}

export interface StackToolbarMenuActionProps {
  /**
   * Can be an Icon, Label or string title.
   */
  children?: ReactNode;
  /**
   * If `true`, the menu item will be disabled and not selectable.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
   */
  disabled?: boolean;
  icon?: SFSymbol | ImageSourcePropType;
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display for the menu action.
   *
   * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
   */
  image?: ImageRef;
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
  /**
   * An optional subtitle for the menu item.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
   */
  subtitle?: string;
  hidden?: boolean;
}

/**
 * An action item for a `Stack.Toolbar.Menu`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="right">
 *         <Stack.Toolbar.Menu icon="ellipsis.circle">
 *           <Stack.Toolbar.MenuAction onPress={() => alert('Action pressed!')}>
 *             Action 1
 *           </Stack.Toolbar.MenuAction>
 *         </Stack.Toolbar.Menu>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarMenuAction: React.FC<StackToolbarMenuActionProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement === 'bottom') {
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    const icon = typeof props.icon === 'string' ? props.icon : undefined;
    return <NativeToolbarMenuAction {...props} icon={icon} image={props.image} />;
  }

  return <MenuAction {...props} />;
};

export function convertStackToolbarMenuActionPropsToRNHeaderItem(
  props: StackToolbarMenuActionProps
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
    // Only SF Symbols are supported in submenu icons
    // TODO(@ubax): Add support for other images in react-native-screens
    if (sharedProps.icon.type === 'sfSymbol') {
      item.icon = sharedProps.icon;
    } else {
      console.warn(
        'When Icon is used inside Stack.Toolbar.MenuAction, only sfSymbol icons are supported. This is a limitation of React Native Screens.'
      );
    }
  }
  return item;
}
