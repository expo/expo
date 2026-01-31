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
   * Content of the link. Can be:
   *
   * - A string label
   * - Composition of `Stack.Toolbar.Icon`, `Stack.Toolbar.Label`, and `Stack.Toolbar.Badge`
   * - Arbitrary React elements (rendered as a custom view bar button item)
   *
   * When arbitrary children are provided, the link renders as a custom view toolbar item
   * (like `Stack.Toolbar.View`) that navigates with a zoom transition on press.
   *
   * @example
   * ```tsx
   * // Using icon prop
   * <Stack.Toolbar.Link href="/new-item" icon="plus" />
   *
   * // Using custom view children
   * <Stack.Toolbar.Link href="/layers">
   *   <View style={{ flexDirection: 'row', gap: 8 }}>
   *     <Image source={'sf:square.3.layers.3d.down.right'} />
   *     <Text>Layers</Text>
   *   </View>
   * </Stack.Toolbar.Link>
   * ```
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
 * Supports two modes:
 * - **Icon/label mode**: Use `icon` prop or `Stack.Toolbar.Icon`/`Stack.Toolbar.Label` children for standard bar button items.
 * - **Custom view mode**: Pass arbitrary React elements as children to render a custom view that navigates on press.
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
 * @example
 * ```tsx
 * <Stack.Toolbar>
 *   <Stack.Toolbar.Link href="/layers">
 *     <View style={{ flexDirection: 'row', gap: 8 }}>
 *       <Image source={'sf:square.3.layers.3d.down.right'} />
 *       <Text>Layers</Text>
 *     </View>
 *   </Stack.Toolbar.Link>
 * </Stack.Toolbar>
 * ```
 *
 * @platform ios
 */
export const StackToolbarLink: React.FC<StackToolbarLinkProps> = (props) => {
  const placement = useToolbarPlacement();

  const primitiveChildren = useMemo(
    () => filterAllowedChildrenElements(props.children, PRIMITIVE_CHILDREN),
    [props.children]
  );

  if (placement === 'bottom') {
    const allChildren = Children.toArray(props.children);
    const hasCustomViewChildren =
      allChildren.length > 0 &&
      typeof props.children !== 'string' &&
      primitiveChildren.length !== allChildren.length;

    if (hasCustomViewChildren) {
      // Custom view mode: pass children through to render as a custom view bar button item
      return (
        <NativeToolbarLink
          accessibilityHint={props.accessibilityHint}
          accessibilityLabel={props.accessibilityLabel}
          href={props.href}
          action={props.action}
          disabled={props.disabled}
          hidden={props.hidden}
          hidesSharedBackground={props.hidesSharedBackground}
          separateBackground={props.separateBackground}
          tintColor={props.tintColor}
          variant={props.variant}>
          {props.children}
        </NativeToolbarLink>
      );
    }

    // Icon/label mode: convert primitive children to bar button item props
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

const PRIMITIVE_CHILDREN = [StackToolbarLabel, StackToolbarIcon, StackToolbarBadge];
