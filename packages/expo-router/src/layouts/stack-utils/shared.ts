import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import { Children, type ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp, TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { StackHeaderBadge, StackHeaderIcon, StackHeaderLabel } from './common-primitives';
import { convertTextStyleToRNTextStyle, getFirstChildOfType } from './utils';

export interface StackHeaderItemSharedProps {
  /**
   * Supports two approaches:
   * 1. <Stack.Header.Button>Text</Stack.Header.Button> - children as text
   * 2. children as components:<Stack.Header.Button>
   * <Icon sf="icon-name" />
   * <Label>Button Text</Label>
   * <Badge>3</Badge>
   * </Stack.Header.Button>
   */
  children?: ReactNode;
  style?: StyleProp<
    Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'color' | 'width'> & {
      /**
       * When set to 'transparent', the button will have no background color.
       *
       * @platform iOS 26+
       */
      backgroundColor?: 'transparent';
    }
  >;
  // Note: when only label (no icon) is used the background is always separated
  separateBackground?: boolean;
  identifier?: string;
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
  const label = getFirstChildOfType(children, StackHeaderLabel);
  const iconPropConvertedToIcon = props.icon
    ? typeof props.icon === 'string'
      ? { sf: props.icon }
      : { src: props.icon }
    : undefined;
  const iconComponentProps =
    getFirstChildOfType(children, StackHeaderIcon)?.props ?? iconPropConvertedToIcon;
  const badgeComponent = getFirstChildOfType(children, StackHeaderBadge);
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
    const { backgroundColor, ...convertedStyle } = convertTextStyleToRNTextStyle(style) ?? {};
    item.labelStyle = convertedStyle;
    item.hidesSharedBackground = backgroundColor === 'transparent';
  } else {
    item.hidesSharedBackground = false;
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
