import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import type { useImage } from 'expo-image';
import { Children, type ReactNode } from 'react';
import { type ColorValue, type ImageSourcePropType, type StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from './common-primitives';
import { getFirstChildOfType } from '../../utils/children';
import { convertTextStyleToRNTextStyle, type BasicTextStyle } from '../../utils/font';

export interface StackHeaderItemSharedProps {
  children?: ReactNode;
  style?: StyleProp<BasicTextStyle>;
  hidesSharedBackground?: boolean;
  separateBackground?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  tintColor?: ColorValue;
  icon?: `sf:${SFSymbol}` | ImageSourcePropType | (string & {});
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

export type UseImageSource = Parameters<typeof useImage>[0];

/**
 * Helper to compute image source for useImage hook from the new icon type (with sf: prefix).
 * Returns empty object for SF symbols (they don't need useImage) and passes through other sources.
 * This avoids complex union type computation that TypeScript can't handle.
 */
export function getImageSourceFromIcon(icon: StackHeaderItemSharedProps['icon']): UseImageSource {
  if (!icon) return {};
  return icon as UseImageSource;
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

export function convertStackHeaderSharedPropsToRNSharedHeaderItem(
  props: StackHeaderItemSharedProps
): RNSharedHeaderItem {
  const { children, style, separateBackground, icon, ...rest } = props;
  const stringChildren = Children.toArray(children)
    .filter((child) => typeof child === 'string')
    .join('');
  const label = getFirstChildOfType(children, StackToolbarLabel);
  const iconPropConvertedToIcon = props.icon
    ? typeof props.icon === 'string'
      ? props.icon.startsWith('sf:')
        ? { sf: props.icon.slice(3) as SFSymbol } // Remove 'sf:' prefix for RN
        : { src: { uri: props.icon } } // Wrap plain string as image source
      : { src: props.icon } // ImageSourcePropType passed as-is
    : undefined;
  const iconComponentProps =
    getFirstChildOfType(children, StackToolbarIcon)?.props ?? iconPropConvertedToIcon;
  const badgeComponent = getFirstChildOfType(children, StackToolbarBadge);
  const rnsIcon: NativeStackHeaderItemButton['icon'] = (() => {
    if (!iconComponentProps) {
      return undefined;
    }
    if ('src' in iconComponentProps && iconComponentProps.src) {
      // Get explicit renderingMode from icon component props, or use iconRenderingMode from shared props
      const explicitRenderingMode =
        'renderingMode' in iconComponentProps ? iconComponentProps.renderingMode : undefined;
      const effectiveRenderingMode =
        explicitRenderingMode ??
        props.iconRenderingMode ??
        (props.tintColor ? 'template' : 'original');
      return {
        type: 'image',
        source: iconComponentProps.src,
        tinted: effectiveRenderingMode === 'template',
      };
    }
    if ('sf' in iconComponentProps && iconComponentProps.sf) {
      return {
        type: 'sfSymbol',
        name: iconComponentProps.sf,
      };
    }
    return undefined;
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
