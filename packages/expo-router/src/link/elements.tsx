'use client';

import type { ImageRef } from 'expo-image';
import React, { isValidElement, use, useId, type PropsWithChildren, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { NativeMenuContext } from './NativeMenuContext';
import { Icon, Label } from '../primitives';
import { HrefPreview } from './preview/HrefPreview';
import { useIsPreview } from './preview/PreviewRouteContext';
import { NativeLinkPreviewAction, NativeLinkPreviewContent } from './preview/native';
import { Slot } from '../ui/Slot';
import { LinkAppleZoom } from './zoom/link-apple-zoom';
import { getFirstChildOfType } from '../utils/children';

export interface LinkMenuActionProps {
  /**
   * The title of the menu item.
   */
  children?: ReactNode;
  /**
   * If `true`, the menu item will be displayed as destructive.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
   */
  destructive?: boolean;
  /**
   * If `true`, the menu item will be disabled and not selectable.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
   */
  disabled?: boolean;
  /**
   * An elaborated title that explains the purpose of the action.
   */
  discoverabilityLabel?: string;
  /**
   * Whether the menu element should be hidden.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/hidden) for more information.
   *
   * @default false
   */
  hidden?: boolean;
  // TODO: support ImageSourcePropType icons in addition to SFSymbols
  /**
   * SF Symbol displayed alongside the menu item.
   */
  icon?: SFSymbol;
  /**
   * Custom image loaded using `useImage()` hook from `expo-image`.
   * Takes priority over `icon` (SF Symbol) when both are provided.
   *
   * @example
   * ```tsx
   * import { useImage } from 'expo-image';
   * import { Link } from 'expo-router';
   *
   * const customIcon = useImage('https://simpleicons.org/icons/expo.svg', {
   *   maxWidth: 24,
   *   maxHeight: 24,
   * });
   *
   * <Link.Menu title="Menu">
   *   <Link.MenuAction image={customIcon} title="Action" onPress={() => {}} />
   * </Link.Menu>
   * ```
   */
  image?: ImageRef | null;
  /**
   * If `true`, the menu item will be displayed as selected.
   */
  isOn?: boolean;
  onPress?: () => void;
  /**
   * An optional subtitle for the menu item.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
   */
  subtitle?: string;
  /**
   * The title of the menu item.
   * @deprecated Use `children` prop instead.
   */
  title?: string;
  /**
   * If `true`, the menu will be kept presented after the action is selected.
   *
   * This is marked as unstable, because when action is selected it will recreate the menu,
   * which will close all opened submenus and reset the scroll position.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented) for more information.
   */
  unstable_keepPresented?: boolean;
}

/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * > **Note**: You can use the alias `Link.MenuAction` for this component.
 *
 * @platform ios
 */
export function LinkMenuAction(props: LinkMenuActionProps) {
  const identifier = useId();
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(NativeMenuContext)) {
    return null;
  }
  const { unstable_keepPresented, onPress, children, title, ...rest } = props;
  const areChildrenString = typeof children === 'string';
  const label = areChildrenString
    ? (children as string)
    : getFirstChildOfType(children, Label)?.props.children;
  const iconComponent =
    !props.icon && !areChildrenString ? getFirstChildOfType(children, Icon) : undefined;
  const icon =
    props.icon ??
    (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
  const sf = typeof icon === 'string' ? icon : undefined;
  return (
    <NativeLinkPreviewAction
      {...rest}
      identifier={identifier}
      icon={sf}
      title={label ?? title ?? ''}
      keepPresented={unstable_keepPresented}
      onSelected={() => onPress?.()}
    />
  );
}

export interface LinkMenuProps {
  /**
   * The title of the menu item
   */
  title?: string;
  /**
   * An optional subtitle for the submenu. Does not appear on `inline` menus.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
   */
  subtitle?: string;
  /**
   * Optional SF Symbol displayed alongside the menu item.
   */
  icon?: SFSymbol;
  /**
   * Custom image loaded using `useImage()` hook from `expo-image`.
   * Takes priority over `icon` (SF Symbol) when both are provided.
   *
   * @example
   * ```tsx
   * import { useImage } from 'expo-image';
   * import { Link } from 'expo-router';
   *
   * const customIcon = useImage('https://simpleicons.org/icons/expo.svg', {
   *   maxWidth: 24,
   *   maxHeight: 24,
   * });
   *
   * <Link.Menu image={customIcon} title="Menu">
   *   <Link.MenuAction title="Action" onPress={() => {}} />
   * </Link.Menu>
   * ```
   */
  image?: ImageRef | null;
  /**
   * If `true`, the menu will be displayed as a palette.
   * This means that the menu will be displayed as one row.
   * The `elementSize` property is ignored when palette is used, all items will be `elementSize="small"`. Use `elementSize="medium"` instead of `palette` to display actions with titles horizontally.
   *
   * > **Note**: Palette menus are only supported in submenus.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
   */
  palette?: boolean;
  /**
   * @deprecated Use `palette` prop instead.
   */
  displayAsPalette?: boolean;
  /**
   * If `true`, the menu will be displayed inline.
   * This means that the menu will not be collapsed
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
   */
  inline?: boolean;
  /**
   * @deprecated Use `inline` prop instead.
   */
  displayInline?: boolean;
  /**
   * If `true`, the menu item will be displayed as destructive.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/destructive) for more information.
   */
  destructive?: boolean;
  /**
   * The preferred size of the menu elements.
   * `elementSize` property is ignored when `palette` is used.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/preferredelementsize) for more information.
   *
   * @platform iOS 16.0+
   */
  elementSize?: 'small' | 'medium' | 'large' | 'auto';
  children?: React.ReactNode;
}

/**
 * Groups context menu actions for a link.
 *
 * If multiple `Link.Menu` components are used within a single `Link`, only the first will be rendered.
 * Only `Link.MenuAction` and `LinkMenuAction` components are allowed as children.
 *
 * @example
 * ```tsx
 * <Link.Menu>
 *   <Link.MenuAction title="Action 1" onPress={() => {}} />
 *   <Link.MenuAction title="Action 2" onPress={() => {}} />
 * </Link.Menu>
 * ```
 *
 * > **Note**: You can use the alias `Link.Menu` for this component.
 *
 * @platform ios
 */
export const LinkMenu: React.FC<LinkMenuProps> = (props) => {
  const identifier = useId();
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(NativeMenuContext)) {
    return null;
  }
  const children = React.Children.toArray(props.children).filter(
    (child) => isValidElement(child) && (child.type === LinkMenuAction || child.type === LinkMenu)
  );
  const displayAsPalette = props.palette ?? props.displayAsPalette;
  const displayInline = props.inline ?? props.displayInline;
  return (
    <NativeLinkPreviewAction
      {...props}
      displayAsPalette={displayAsPalette}
      displayInline={displayInline}
      preferredElementSize={props.elementSize}
      title={props.title ?? ''}
      onSelected={() => {}}
      children={children}
      identifier={identifier}
    />
  );
};

export type LinkPreviewStyle = Omit<ViewStyle, 'position' | 'width' | 'height'> & {
  /**
   * Sets the preferred width of the preview.
   * If not set, full width of the screen will be used.
   *
   * This is only **preferred** width, the actual width may be different
   */
  width?: number;

  /**
   * Sets the preferred height of the preview.
   * If not set, full height of the screen will be used.
   *
   * This is only **preferred** height, the actual height may be different
   */
  height?: number;
};

export interface LinkPreviewProps {
  children?: React.ReactNode;
  /**
   * Custom styles for the preview container.
   *
   * Note that some styles may not work, as they are limited or reset by the native view
   */
  style?: LinkPreviewStyle;
}

/**
 * A component used to render and customize the link preview.
 *
 * If `Link.Preview` is used without any props, it will render a preview of the `href` passed to the `Link`.
 *
 * If multiple `Link.Preview` components are used within a single `Link`, only the first one will be rendered.
 *
 * To customize the preview, you can pass custom content as children.
 *
 * @example
 * ```tsx
 * <Link href="/about">
 *   <Link.Preview>
 *     <Text>Custom Preview Content</Text>
 *   </Link.Preview>
 * </Link>
 * ```
 *
 * @example
 * ```tsx
 * <Link href="/about">
 *   <Link.Preview />
 * </Link>
 * ```
 *
 * > **Note**: You can use the alias `Link.Preview` for this component.
 *
 * @platform ios
 */
export function LinkPreview(props: LinkPreviewProps) {
  const { children, style } = props;
  const internalPreviewContext = use(InternalLinkPreviewContext);
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !internalPreviewContext) {
    return null;
  }
  const { isVisible, href } = internalPreviewContext;
  const { width, height, ...restOfStyle } = style ?? {};
  const contentSize = {
    width: width ?? 0,
    height: height ?? 0,
  };
  let content: React.ReactNode;
  if (children) {
    content = isVisible ? children : null;
  } else {
    content = isVisible ? <HrefPreview href={href} /> : null;
  }

  return (
    <NativeLinkPreviewContent style={restOfStyle} preferredContentSize={contentSize}>
      {content}
    </NativeLinkPreviewContent>
  );
}

export interface LinkTriggerProps extends PropsWithChildren {
  /**
   * A shorthand for enabling the Apple Zoom Transition on this link trigger.
   *
   * When set to `true`, the trigger will be wrapped with `Link.AppleZoom`.
   * If another `Link.AppleZoom` is already used inside `Link.Trigger`, an error
   * will be thrown.
   *
   * @platform ios 18+
   */
  withAppleZoom?: boolean;
}

/**
 * Serves as the trigger for a link.
 * The content inside this component will be rendered as part of the base link.
 *
 * If multiple `Link.Trigger` components are used within a single `Link`, only the first will be rendered.
 *
 * @example
 * ```tsx
 * <Link href="/about">
 *   <Link.Trigger>
 *     Trigger
 *   </Link.Trigger>
 * </Link>
 * ```
 *
 * > **Note**: You can use the alias `Link.Trigger` for this component.
 *
 * @platform ios
 */
export function LinkTrigger({ withAppleZoom, ...props }: LinkTriggerProps) {
  if (React.Children.count(props.children) > 1 || !isValidElement(props.children)) {
    // If onPress is passed, this means that Link passed props to this component.
    // We can assume that asChild is used, so we throw an error, because link will not work in this case.
    if (props && typeof props === 'object' && 'onPress' in props) {
      throw new Error(
        'When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.'
      );
    }
    return props.children;
  }
  const content = <Slot {...props} />;
  if (withAppleZoom) {
    return <LinkAppleZoom>{content}</LinkAppleZoom>;
  }
  return content;
}
