import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import { Children, type ReactNode } from 'react';
import { type ColorValue, type ImageSourcePropType, type StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from './toolbar-primitives';
import { getFirstChildOfType } from '../../../utils/children';
import { convertTextStyleToRNTextStyle, type BasicTextStyle } from '../../../utils/font';

export interface StackHeaderItemSharedProps {
  children?: ReactNode;
  style?: StyleProp<BasicTextStyle>;
  hidesSharedBackground?: boolean;
  separateBackground?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  tintColor?: ColorValue;
  icon?: SFSymbol | ImageSourcePropType;
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
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
   *
   * @platform ios
   */
  iconRenderingMode?: 'template' | 'original';
  /**
   * @default 'plain'
   */
  variant?: 'plain' | 'done' | 'prominent';
}

// We need to pick these properties, as the SharedHeaderItem is not exported by React Navigation
type RNSharedHeaderItem = Pick<
  NativeStackHeaderItemButton,
  | 'label'
  | 'labelStyle'
  | 'icon'
  | 'variant'
  | 'tintColor'
  | 'disabled'
  | 'width'
  | 'hidesSharedBackground'
  | 'sharesBackground'
  | 'identifier'
  | 'badge'
  | 'accessibilityLabel'
  | 'accessibilityHint'
>;

/** @internal */
export function extractXcassetName(props: StackHeaderItemSharedProps): string | undefined {
  const iconComponentProps = getFirstChildOfType(props.children, StackToolbarIcon)?.props;
  if (iconComponentProps && 'xcasset' in iconComponentProps) {
    return iconComponentProps.xcasset;
  }
  return undefined;
}

/**
 * Extracts the rendering mode from the Icon child component (for `src` and `xcasset` variants).
 * Returns undefined if no explicit rendering mode is set on the Icon child.
 * @internal
 */
export function extractIconRenderingMode(
  props: StackHeaderItemSharedProps
): 'template' | 'original' | undefined {
  const iconComponentProps = getFirstChildOfType(props.children, StackToolbarIcon)?.props;
  if (iconComponentProps && 'renderingMode' in iconComponentProps) {
    return iconComponentProps.renderingMode;
  }
  return undefined;
}

export function convertStackHeaderSharedPropsToRNSharedHeaderItem(
  props: StackHeaderItemSharedProps,
  isBottomPlacement: boolean = false
): RNSharedHeaderItem {
  const { children, style, separateBackground, icon, ...rest } = props;
  const stringChildren = Children.toArray(children)
    .filter((child) => typeof child === 'string')
    .join('');
  const label = getFirstChildOfType(children, StackToolbarLabel);
  const iconPropConvertedToIcon = props.icon
    ? typeof props.icon === 'string'
      ? { sf: props.icon }
      : { src: props.icon }
    : undefined;
  const iconComponentProps =
    getFirstChildOfType(children, StackToolbarIcon)?.props ?? iconPropConvertedToIcon;
  const badgeComponent = getFirstChildOfType(children, StackToolbarBadge);
  const rnsIcon: NativeStackHeaderItemButton['icon'] = (() => {
    if (!iconComponentProps) {
      return undefined;
    }
    // Bottom placement xcasset uses native xcasset type
    if ('xcasset' in iconComponentProps && isBottomPlacement) {
      return {
        type: 'xcasset',
        name: iconComponentProps.xcasset,
      } as unknown as NativeStackHeaderItemButton['icon'];
    }
    // Unified image path for src and xcasset (non-bottom)
    if ('src' in iconComponentProps || 'xcasset' in iconComponentProps) {
      const source =
        'src' in iconComponentProps ? iconComponentProps.src : { uri: iconComponentProps.xcasset };
      const explicitRenderingMode =
        'renderingMode' in iconComponentProps ? iconComponentProps.renderingMode : undefined;
      const effectiveRenderingMode =
        explicitRenderingMode ??
        props.iconRenderingMode ??
        (props.tintColor ? 'template' : 'original');
      return {
        type: 'image',
        source,
        tinted: effectiveRenderingMode === 'template',
      };
    }
    return {
      type: 'sfSymbol',
      name: iconComponentProps.sf,
    };
  })();
  const item: RNSharedHeaderItem = {
    ...rest,
    label: label?.props.children ?? stringChildren,
    sharesBackground: !separateBackground,
  };
  if (style) {
    const convertedStyle = convertTextStyleToRNTextStyle(style) ?? {};
    item.labelStyle = convertedStyle;
  }
  if (badgeComponent) {
    item.badge = {
      value: badgeComponent.props.children ?? '',
    };
    const badgeStyle = convertTextStyleToRNTextStyle(badgeComponent.props.style);
    if (badgeStyle) {
      item.badge.style = badgeStyle;
    }
  }
  if (rnsIcon) {
    item.icon = rnsIcon;
  }
  return item;
}
