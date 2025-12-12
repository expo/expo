import { nanoid } from 'nanoid/non-secure';
import { useMemo } from 'react';
import { View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { RouterToolbarHost, RouterToolbarItem } from './native';
import { InternalLinkPreviewContext } from '../link/InternalLinkPreviewContext';
import {
  LinkMenu,
  LinkMenuAction,
  type LinkMenuActionProps,
  type LinkMenuProps,
} from '../link/elements';

/**
 * Props for the Toolbar.Menu component.
 *
 * @see [LinkMenuProps](./router/#linkmenuprops).
 *
 * @platform ios
 */
export interface ToolbarMenuProps extends LinkMenuProps {
  /**
   * Whether the button shares the background with adjacent toolbar items.
   *
   * **important**: Text buttons cannot share the background.
   *
   * Only available for root level menus.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground
   *
   * @default true
   *
   * @platform iOS 26+
   */
  sharesBackground?: boolean;
  /**
   * Whether to hide the shared background when `sharesBackground` is enabled.
   *
   * Only available for root level menus.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
}

/**
 * This component renders a context menu for a toolbar.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Menu title="Options">
 *     <Toolbar.MenuAction title="Action 1" onPress={() => {}} />
 *     <Toolbar.MenuAction title="Action 2" onPress={() => {}} />
 *   </Toolbar.Menu>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export const ToolbarMenu = LinkMenu;

/**
 * Props for the Toolbar.MenuAction component.
 * For available props, see [LinkMenuActionProps](./router/#linkmenuactionprops).
 *
 * @platform ios
 */
export type ToolbarMenuActionProps = LinkMenuActionProps;

/**
 * A single action item within a toolbar menu.
 * It should only be used as a child of `Toolbar.Menu`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Menu title="Options">
 *     <Toolbar.MenuAction title="Action 1" onPress={() => {}} />
 *     <Toolbar.MenuAction title="Action 2" onPress={() => {}} />
 *   </Toolbar.Menu>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export const ToolbarMenuAction = LinkMenuAction;

/**
 * Props for the ToolbarButton component.
 *
 * @platform ios
 */
export interface ToolbarButtonProps {
  /**
   * String content to display inside the button.
   * If `sf` is provided, this will be used as the accessibility label.
   */
  children?: React.ReactNode;
  /**
   * The name of the SF Symbol to display as the button icon.
   * For a list of available symbols, see [SF Symbols](https://developer.apple.com/sf-symbols/).
   */
  sf?: SFSymbol;
  /**
   * Fixed width for the button in points.
   */
  width?: number;
  /**
   * Callback function when the button is pressed.
   */
  onPress?: () => void;
  // As noted in https://sebvidal.com/blog/whats-new-in-uikit-26/?utm_source=chatgpt.com#:~:text=It%27s%20worth%20noting%20that%2C%20at%20the%20time%20of%20writing%2C%20bar%20button%20badges%20are%20only%20supported%20in%20navigation%20bars%20%2D%20not%20tool%20bars.
  // currently badges are not supported in toolbars, and only in navigation bars.
  // badgeConfiguration?: {
  //   value?: string;
  //   backgroundColor?: ColorValue;
  //   color?: ColorValue;
  //   fontFamily?: string;
  //   fontSize?: number;
  //   fontWeight?: string;
  // };
  /**
   * Color to apply to the button icon.
   */
  tintColor?: ColorValue;
  /**
   * Whether the button should be hidden
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Whether the button shares the background with adjacent toolbar items.
   *
   * **important**: Text buttons cannot share the background.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground
   *
   * @default true
   *
   * @platform iOS 26+
   */
  sharesBackground?: boolean;
  /**
   * Whether to hide the shared background when `sharesBackground` is enabled.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
}

/**
 * A button component for use in the toolbar.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Button sf="magnifyingglass" tintColor={Color.ios.placeholderText} />
 *   <Toolbar.Button sf="mic" onPress={() => console.log('Mic pressed')} />
 *   <Toolbar.Button hidden={!isSearchFocused} sf="xmark" onPress={handleClear} />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export const ToolbarButton = ({ children, sf, onPress, ...rest }: ToolbarButtonProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <RouterToolbarItem
      {...rest}
      onSelected={onPress}
      identifier={id}
      title={String(children)}
      systemImageName={sf}
    />
  );
};

/**
 * Props for the Toolbar.Spacer component.
 *
 * @platform ios
 */
export type ToolbarSpacerProps = {
  /**
   * By default, the spacer is flexible and expands to fill available space.
   * If a width is provided, it creates a [fixed-width spacer](https://developer.apple.com/documentation/uikit/uibarbuttonitem/fixedspace(_:)).
   */
  width?: number;
  /**
   * Whether the spacer should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Whether the spacer shares the background with adjacent toolbar items.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground
   *
   * @platform iOS 26+
   * @default false
   */
  sharesBackground?: boolean;
  /**
   * Whether to hide the shared background when `sharesBackground` is enabled.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
};

/**
 * A spacer component for the toolbar.
 * Without a width, it creates a flexible spacer that expands to fill available space.
 * With a width, it creates a fixed-width spacer.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.Button sf="magnifyingglass" />
 *   <Toolbar.Spacer width={20} />
 *   <Toolbar.Button sf="mic" />
 *   <Toolbar.Spacer />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export const ToolbarSpacer = ({ width, ...rest }: ToolbarSpacerProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <RouterToolbarItem
      {...rest}
      identifier={id}
      type={width ? 'fixedSpacer' : 'fluidSpacer'}
      width={width}
    />
  );
};

/**
 * Props for the ToolbarView component.
 *
 * @platform ios
 */
export interface ToolbarViewProps {
  /**
   * Whether to hide the shared background when `sharesBackground` is enabled.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground
   *
   * @platform iOS 18+
   */
  hidesSharedBackground?: boolean;
  /**
   * Whether the view shares the background with adjacent toolbar items.
   *
   * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground
   *
   * @platform iOS 18+
   * @default true
   */
  sharesBackground?: boolean;
  /**
   * React elements to render inside the toolbar view.
   */
  children: React.ReactNode;
  /**
   * Whether the view should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Style properties for the view.
   * Note: Position-related styles (position, inset, top, left, right, bottom, flex) are not allowed.
   */
  style?: StyleProp<
    Omit<ViewStyle, 'position' | 'inset' | 'top' | 'left' | 'right' | 'bottom' | 'flex'>
  >;
}

/**
 * A custom view component for the toolbar that can contain any React elements.
 * Useful for embedding custom components.
 * It should only be used as a child of `Toolbar`.
 *
 * The items within the view will be absolutely positioned, so flexbox styles will not work as expected.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.View style={{ width: 200 }}>
 *     <TextInput
 *       placeholder="Search"
 *       placeholderTextColor={Color.ios.placeholderText}
 *     />
 *   </Toolbar.View>
 *   <Toolbar.View sharesBackground={false} style={{ width: 32, height: 32 }}>
 *     <Pressable onPress={handlePress}>
 *       <SymbolView name="plus" size={22} />
 *     </Pressable>
 *   </Toolbar.View>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export const ToolbarView = ({ children, style, ...rest }: ToolbarViewProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <RouterToolbarItem {...rest} identifier={id}>
      <View style={[style, { position: 'absolute' }]}>{children}</View>
    </RouterToolbarItem>
  );
};

/**
 * Props for the Toolbar component.
 *
 * @platform ios
 */
export interface ToolbarProps {
  children?: React.ReactNode;
}

/**
 * The main Toolbar component that provides a customizable toolbar at the bottom of the screen.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.Button sf="magnifyingglass" tintColor={Color.ios.placeholderText} />
 *   <Toolbar.View style={{ width: 200 }}>
 *     <TextInput placeholder="Search" />
 *   </Toolbar.View>
 *   <Toolbar.Menu icon="ellipsis">
 *     <Toolbar.MenuAction icon="mail" title="Send email" onPress={() => {}} />
 *     <Toolbar.MenuAction icon="trash" title="Delete" destructive onPress={() => {}} />
 *   </Toolbar.Menu>
 *   <Toolbar.Spacer />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export const ToolbarHost = (props: ToolbarProps) => {
  // TODO: Replace InternalLinkPreviewContext with a more generic context
  return (
    <InternalLinkPreviewContext value={{ isVisible: false, href: '' }}>
      <RouterToolbarHost {...props} />
    </InternalLinkPreviewContext>
  );
};
