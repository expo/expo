'use client';
import type {
  NativeStackHeaderItemMenu,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import { Children, useId, useMemo, type ReactNode } from 'react';
import {
  StyleSheet,
  type ColorValue,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useToolbarPlacement } from './context';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  extractIconRenderingMode,
  extractXcassetName,
  type StackHeaderItemSharedProps,
} from './shared';
import { StackToolbarLabel, StackToolbarIcon, StackToolbarBadge } from './toolbar-primitives';
import { LinkMenuAction } from '../../../link/elements';
import { NativeLinkPreviewAction } from '../../../link/preview/native';
import {
  filterAllowedChildrenElements,
  getFirstChildOfType,
  isChildOfType,
} from '../../../utils/children';

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
   * Controls how image-based icons are rendered on iOS.
   *
   * - `'template'`: iOS applies tint color to the icon (useful for monochrome icons)
   * - `'original'`: Preserves original icon colors (useful for multi-color icons)
   *
   * **Default behavior:**
   * - If `tintColor` is specified, defaults to `'template'`
   * - If no `tintColor`, defaults to `'original'`
   *
   * This prop only affects image-based icons (not SF Symbols).
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
   *
   * @platform ios
   */
  iconRenderingMode?: 'template' | 'original';
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

  const sharedProps = convertStackToolbarMenuPropsToRNHeaderItem(props, true);

  const computedLabel = sharedProps?.label;
  const computedMenuTitle = sharedProps?.menu?.title;
  const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
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
   * Controls how image-based icons are rendered on iOS.
   *
   * - `'template'`: iOS applies tint color to the icon (useful for monochrome icons)
   * - `'original'`: Preserves original icon colors (useful for multi-color icons)
   *
   * **Default behavior:**
   * - If `tintColor` is specified, defaults to `'template'`
   * - If no `tintColor`, defaults to `'original'`
   *
   * This prop only affects image-based icons (not SF Symbols).
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
   *
   * @platform ios
   */
  iconRenderingMode?: 'template' | 'original';
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

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.MenuAction must be used inside a Stack.Toolbar.Menu');
  }

  // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
  const icon = typeof props.icon === 'string' ? props.icon : undefined;
  return (
    <NativeToolbarMenuAction
      {...props}
      icon={icon}
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

// #region NativeToolbarMenu

interface NativeToolbarMenuProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children?: ReactNode;
  subtitle?: string;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  icon?: SFSymbol;
  xcassetName?: string;
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display for the menu item.
   */
  image?: ImageRef;
  imageRenderingMode?: 'template' | 'original';
  inline?: boolean;
  label?: string;
  palette?: boolean;
  separateBackground?: boolean;
  style?: StyleProp<TextStyle>;
  title?: string;
  tintColor?: ColorValue;
  variant?: 'plain' | 'done' | 'prominent';
  elementSize?: 'auto' | 'small' | 'medium' | 'large';
}

/**
 * Native toolbar menu component for bottom toolbar.
 * Renders as NativeLinkPreviewAction.
 */
const NativeToolbarMenu: React.FC<NativeToolbarMenuProps> = ({
  accessibilityHint,
  accessibilityLabel,
  separateBackground,
  hidesSharedBackground,
  palette,
  inline,
  hidden,
  subtitle,
  title,
  label,
  destructive,
  children,
  icon,
  xcassetName,
  image,
  imageRenderingMode,
  tintColor,
  variant,
  style,
  elementSize,
}) => {
  const identifier = useId();

  const titleStyle = StyleSheet.flatten(style);
  const renderingMode = imageRenderingMode ?? (tintColor !== undefined ? 'template' : 'original');
  return (
    <NativeLinkPreviewAction
      sharesBackground={!separateBackground}
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      icon={icon}
      xcassetName={xcassetName}
      // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
      image={image}
      imageRenderingMode={renderingMode}
      destructive={destructive}
      subtitle={subtitle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      displayAsPalette={palette}
      displayInline={inline}
      preferredElementSize={elementSize}
      tintColor={tintColor}
      titleStyle={titleStyle}
      barButtonItemStyle={variant === 'done' ? 'prominent' : variant}
      title={title ?? ''}
      label={label}
      onSelected={() => {}}
      children={children}
      identifier={identifier}
    />
  );
};

// #endregion

// #region NativeToolbarMenuAction

/**
 * Native toolbar menu action - reuses LinkMenuAction.
 */
const NativeToolbarMenuAction = LinkMenuAction;

// #endregion

const ALLOWED_CHILDREN = [
  StackToolbarMenu,
  StackToolbarMenuAction,
  NativeToolbarMenu,
  NativeToolbarMenuAction,
  StackToolbarLabel,
  StackToolbarIcon,
  StackToolbarBadge,
];
