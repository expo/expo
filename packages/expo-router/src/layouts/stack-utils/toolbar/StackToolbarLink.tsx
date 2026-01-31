'use client';
import type { ImageRef } from 'expo-image';
import { Children, useMemo, type ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { NativeToolbarLink } from './bottom-toolbar-native-elements';
import { useToolbarPlacement } from './context';
import type { Href } from '../../../types';
import { filterAllowedChildrenElements } from '../../../utils/children';
import { StackToolbarLabel, StackToolbarIcon, StackToolbarBadge } from '../common-primitives';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from '../shared';

export interface StackToolbarLinkProps {
  /**
   * Route to navigate to (same as Link's href).
   */
  href: Href;
  /**
   * Whether to use push, navigate, or replace.
   *
   * @default 'push'
   */
  action?: 'push' | 'navigate' | 'replace';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * There are two ways to specify the content of the link:
   *
   * - A string label as children
   * - Composition of Stack.Toolbar.Icon, Stack.Toolbar.Label, and Stack.Toolbar.Badge
   *
   * > **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only.
   */
  children?: ReactNode;
  disabled?: boolean;
  /**
   * Whether the link should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Whether to hide the shared background.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  /**
   * Icon to display in the link.
   *
   * Can be a string representing an SFSymbol or an image source.
   *
   * > **Note**: When used in `placement="bottom"`, only string SFSymbols are supported. Use the `image` prop to provide custom images.
   */
  icon?: StackHeaderItemSharedProps['icon'];
  /**
   * Image to display in the link.
   *
   * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
   */
  image?: ImageRef;
  /**
   * Controls how image-based icons are rendered on iOS.
   *
   * - `'template'`: iOS applies tint color to the icon
   * - `'original'`: Preserves original icon colors (useful for multi-color icons)
   *
   * **Default behavior:**
   * - If `tintColor` is specified, defaults to `'template'`
   * - If no `tintColor`, defaults to `'original'`
   *
   * This prop only affects image-based icons (not SF Symbols).
   *
   * @platform ios
   */
  iconRenderingMode?: 'template' | 'original';
  /**
   * Whether to separate the background of this item from other header items.
   *
   * @default false
   */
  separateBackground?: boolean;
  /**
   * Style for the label of the header item.
   */
  style?: StyleProp<TextStyle>;
  /**
   * The tint color to apply to the link item.
   */
  tintColor?: StackHeaderItemSharedProps['tintColor'];
  /**
   * @default 'plain'
   */
  variant?: StackHeaderItemSharedProps['variant'];
}

/**
 * A link used inside `Stack.Toolbar` that navigates with a zoom transition from the bar button item on iOS 26+.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Link href="/new-item" icon="plus" />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarLink: React.FC<StackToolbarLinkProps> = (props) => {
  const placement = useToolbarPlacement();

  const validChildren = useMemo(
    () => filterAllowedChildrenElements(props.children, ALLOWED_CHILDREN),
    [props.children]
  );

  if (process.env.NODE_ENV !== 'production') {
    if (typeof props.children !== 'string') {
      const allChildren = Children.toArray(props.children);
      if (allChildren.length !== validChildren.length) {
        throw new Error(
          `Stack.Toolbar.Link only accepts a single string or Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.`
        );
      }
    }
  }

  if (placement === 'bottom') {
    const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props);
    const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
    return (
      <NativeToolbarLink
        {...sharedProps}
        href={props.href}
        action={props.action}
        icon={icon}
        image={props.image}
        imageRenderingMode={props.iconRenderingMode}
      />
    );
  }

  // Left/right placement: not supported for zoom transitions from bar button items
  return null;
};

const ALLOWED_CHILDREN = [StackToolbarLabel, StackToolbarIcon, StackToolbarBadge];
