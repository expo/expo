'use client';
import { Children, useMemo, type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { PlatformIconIOS } from 'react-native-screens';

import { NativeToolbarMenu, NativeToolbarMenuAction } from './native';
import type { StackToolbarMenuProps, StackToolbarMenuActionProps } from './types';
import type {
  NativeStackHeaderItemMenu,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from '../../../../react-navigation/native-stack';
import {
  filterAllowedChildrenElements,
  getFirstChildOfType,
  isChildOfType,
} from '../../../../utils/children';
import { useToolbarPlacement } from '../context';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  extractIconRenderingMode,
  extractXcassetName,
} from '../shared';
import { StackToolbarLabel, StackToolbarIcon, StackToolbarBadge } from '../toolbar-primitives';

export type {
  StackToolbarMenuProps,
  NativeToolbarMenuProps,
  StackToolbarMenuActionProps,
  NativeToolbarMenuActionProps,
} from './types';

/**
 * Computes the label and menu title from children and title prop.
 *
 * - If only `title` prop is provided, it is used for both the label (button text) and menu title
 * - If only `.Label` child is provided, it is used for the label and the menu title is an empty string
 * - If both `.Label` child and `title` prop are provided. `.Label` is used for the label, and `title` is used for the menu title
 */
function computeMenuLabelAndTitle(
  children: ReactNode,
  title: string | undefined
): { label: string; menuTitle: string } {
  const labelChild = getFirstChildOfType(children, StackToolbarLabel);
  const labelFromChild = labelChild?.props.children;
  return {
    label: labelFromChild ?? title ?? '',
    menuTitle: title ?? '',
  };
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
export const StackToolbarMenu: React.FC<StackToolbarMenuProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement !== 'bottom') {
    // For placement other than bottom, this component will not render, and should be
    // converted to RN header item using convertStackToolbarMenuPropsToRNHeaderItem.
    // So if we reach here, it means we're not inside a toolbar or something else is wrong.
    throw new Error('Stack.Toolbar.Menu must be used inside a Stack.Toolbar');
  }

  const validChildren = useMemo(
    () => filterAllowedChildrenElements(props.children, ALLOWED_CHILDREN),
    [props.children]
  );

  // Use shared conversion that doesn't bail on hidden, so source is always computed
  // and NativeToolbarMenu always renders — letting AnimatedItemContainer handle visibility.
  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props, true);
  const { label: computedLabel, menuTitle: computedMenuTitle } = computeMenuLabelAndTitle(
    props.children,
    props.title
  );
  const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
  const source = sharedProps?.icon?.type === 'image' ? sharedProps.icon.source : undefined;
  const xcassetName = extractXcassetName(props);
  const imageRenderingMode = extractIconRenderingMode(props) ?? props.iconRenderingMode;

  if (process.env.NODE_ENV !== 'production') {
    const allChildren = Children.toArray(props.children);
    if (allChildren.length !== validChildren.length) {
      throw new Error(
        `Stack.Toolbar.Menu only accepts Stack.Toolbar.Menu, Stack.Toolbar.MenuAction, Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.`
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const hasBadge = getFirstChildOfType(props.children, StackToolbarBadge);
    if (hasBadge) {
      console.warn(
        'Stack.Toolbar.Badge is not supported in bottom toolbar (iOS limitation). The badge will be ignored.'
      );
    }
  }

  // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
  return (
    <NativeToolbarMenu
      {...props}
      icon={icon}
      source={source}
      xcassetName={xcassetName}
      image={props.image}
      imageRenderingMode={imageRenderingMode}
      label={computedLabel}
      title={computedMenuTitle}
      children={validChildren}
    />
  );
};

export function convertStackToolbarMenuPropsToRNHeaderItem(
  props: StackToolbarMenuProps,
  isBottomPlacement: boolean = false
): NativeStackHeaderItemMenu | undefined {
  if (props.hidden) {
    return undefined;
  }
  const { title, ...rest } = props;
  const actions = Children.toArray(props.children).filter(
    (child) =>
      isChildOfType(child, StackToolbarMenuAction) || isChildOfType(child, StackToolbarMenu)
  );

  const { label: computedLabel, menuTitle: computedMenuTitle } = computeMenuLabelAndTitle(
    props.children,
    title
  );

  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(rest, isBottomPlacement);

  const item: NativeStackHeaderItemMenu = {
    ...sharedProps,
    label: computedLabel,
    type: 'menu',
    menu: {
      multiselectable: true,
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
  if (computedMenuTitle) {
    item.menu.title = computedMenuTitle;
  }

  return item;
}

// Custom menu action icons are not supported in react-navigation yet
// But they are supported in react-native-screens
// TODO(@ubax): Remove this workaround once react-navigation supports custom icons for menu actions.
// https://linear.app/expo/issue/ENG-19853/remove-custom-conversion-logic-for-icon-from-packagesexpo
function convertImageIconToPlatformIcon(icon: {
  source: ImageSourcePropType;
  tinted?: boolean;
}): PlatformIconIOS {
  return icon.tinted
    ? { type: 'templateSource', templateSource: icon.source }
    : { type: 'imageSource', imageSource: icon.source };
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

  const item: NativeStackHeaderItemMenuSubmenu = {
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
    multiselectable: true,
  };

  if (props.inline !== undefined) {
    item.inline = props.inline;
  }
  if (props.palette !== undefined) {
    item.layout = props.palette ? 'palette' : 'default';
  }
  if (props.destructive !== undefined) {
    item.destructive = props.destructive;
  }
  // TODO: Add elementSize to react-native-screens

  if (sharedProps.icon) {
    if (sharedProps.icon.type === 'sfSymbol') {
      item.icon = sharedProps.icon;
    } else {
      item.icon = convertImageIconToPlatformIcon(
        sharedProps.icon
      ) as unknown as NativeStackHeaderItemMenuSubmenu['icon'];
    }
  }

  return item;
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

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.MenuAction must be used inside a Stack.Toolbar.Menu');
  }

  // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
  const icon = typeof props.icon === 'string' ? props.icon : undefined;
  const source = typeof props.icon !== 'string' ? props.icon : undefined;
  return (
    <NativeToolbarMenuAction
      {...props}
      icon={icon}
      source={source}
      image={props.image}
      imageRenderingMode={props.iconRenderingMode}
    />
  );
};

export function convertStackToolbarMenuActionPropsToRNHeaderItem(
  props: StackToolbarMenuActionProps
): NativeStackHeaderItemMenuAction {
  const { children, isOn, unstable_keepPresented, icon, ...rest } = props;
  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props);
  const item: NativeStackHeaderItemMenuAction = {
    ...rest,
    description: props.subtitle,
    type: 'action',
    label: sharedProps.label,
    state: isOn ? 'on' : 'off',
    onPress: props.onPress ?? (() => {}),
  };
  if (unstable_keepPresented !== undefined) {
    item.keepsMenuPresented = unstable_keepPresented;
  }
  if (sharedProps.icon) {
    if (sharedProps.icon.type === 'sfSymbol') {
      item.icon = sharedProps.icon;
    } else {
      item.icon = convertImageIconToPlatformIcon(
        sharedProps.icon
      ) as unknown as NativeStackHeaderItemMenuAction['icon'];
    }
  }
  return item;
}

const ALLOWED_CHILDREN = [
  StackToolbarMenu,
  StackToolbarMenuAction,
  NativeToolbarMenu,
  NativeToolbarMenuAction,
  StackToolbarLabel,
  StackToolbarIcon,
  StackToolbarBadge,
];
