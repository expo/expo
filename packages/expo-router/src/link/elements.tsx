'use client';

import React, { isValidElement, use, type PropsWithChildren, type ReactElement } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { HrefPreview } from './preview/HrefPreview';
import { useIsPreview } from './preview/PreviewRouteContext';
import { NativeLinkPreviewAction, NativeLinkPreviewContent } from './preview/native';
import { Slot } from '../ui/Slot';

export interface LinkMenuActionProps {
  /**
   * The title of the menu item.
   */
  title: string;
  /**
   * Optional SF Symbol displayed alongside the menu item.
   */
  icon?: SFSymbol;
  /**
   * If `true`, the menu item will be disabled and not selectable.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
   */
  disabled?: boolean;
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
  onPress: () => void;
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
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(InternalLinkPreviewContext)) {
    return null;
  }
  const { unstable_keepPresented, onPress, ...rest } = props;
  return (
    <NativeLinkPreviewAction
      {...rest}
      onSelected={onPress}
      keepPresented={unstable_keepPresented}
    />
  );
}

export interface LinkMenuProps {
  /**
   * The title of the menu item
   */
  title?: string;
  /**
   * Optional SF Symbol displayed alongside the menu item.
   */
  icon?: string;
  /**
   * If `true`, the menu will be displayed as a palette.
   * This means that the menu will be displayed as one row
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
   */
  displayAsPalette?: boolean;
  /**
   * If `true`, the menu will be displayed inline.
   * This means that the menu will not be collapsed
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
   */
  displayInline?: boolean;
  /**
   * If `true`, the menu item will be displayed as destructive.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/destructive) for more information.
   */
  destructive?: boolean;
  children: ReactElement<LinkMenuActionProps> | ReactElement<LinkMenuActionProps>[];
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
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(InternalLinkPreviewContext)) {
    return null;
  }
  const children = React.Children.toArray(props.children).filter(
    (child) => isValidElement(child) && (child.type === LinkMenuAction || child.type === LinkMenu)
  );
  return (
    <NativeLinkPreviewAction
      {...props}
      title={props.title ?? ''}
      onSelected={() => {}}
      children={children}
    />
  );
};

export interface LinkPreviewProps {
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
  children?: React.ReactNode;
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
 *   </Link.Trigger>
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
  const { width, height, children } = props;
  const internalPreviewContext = use(InternalLinkPreviewContext);
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !internalPreviewContext) {
    return null;
  }
  const { isVisible, href } = internalPreviewContext;
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
    <NativeLinkPreviewContent
      style={{
        /* Setting default background here, so that the preview is not transparent */
        backgroundColor: '#fff',
      }}
      preferredContentSize={contentSize}>
      {content}
    </NativeLinkPreviewContent>
  );
}

export type LinkTriggerProps = PropsWithChildren;

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
export function LinkTrigger(props: LinkTriggerProps) {
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
  return <Slot {...props} />;
}
