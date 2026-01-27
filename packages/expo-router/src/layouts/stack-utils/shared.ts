import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
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
  icon?: SFSymbol | ImageSourcePropType;
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
    if ('src' in iconComponentProps) {
      return {
        type: 'image',
        source: iconComponentProps.src,
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
