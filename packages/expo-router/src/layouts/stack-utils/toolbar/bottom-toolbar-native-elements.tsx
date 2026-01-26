'use client';
import type { ImageRef } from 'expo-image';
import { useId, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  type ColorValue,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { LinkMenuAction } from '../../../link/elements';
import { NativeLinkPreviewAction } from '../../../link/preview/native';
import { Label, Icon } from '../../../primitives';
import { RouterToolbarItem } from '../../../toolbar/native';
import { getFirstChildOfType } from '../../../utils/children';
import type { BasicTextStyle } from '../../../utils/font';

// #region NativeToolbarMenu

export interface NativeToolbarMenuProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children?: ReactNode;
  subtitle?: string;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  icon?: SFSymbol | ImageSourcePropType;
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display for the menu item.
   */
  image?: ImageRef;
  inline?: boolean;
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
export const NativeToolbarMenu: React.FC<NativeToolbarMenuProps> = ({
  accessibilityHint,
  accessibilityLabel,
  separateBackground,
  hidesSharedBackground,
  palette,
  inline,
  hidden,
  subtitle,
  title,
  destructive,
  children,
  icon,
  image,
  tintColor,
  variant,
  style,
  elementSize,
}) => {
  const identifier = useId();
  const label = getFirstChildOfType(children, Label);
  const iconComponent = getFirstChildOfType(children, Icon);

  const computedTitle = title ?? label?.props.children ?? '';
  const computedIcon =
    icon ??
    (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
  const sf = typeof computedIcon === 'string' ? computedIcon : undefined;
  const titleStyle = StyleSheet.flatten(style);
  return (
    <NativeLinkPreviewAction
      sharesBackground={!separateBackground}
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      icon={sf}
      // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
      image={image}
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
      title={computedTitle}
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
export const NativeToolbarMenuAction = LinkMenuAction;

// #endregion

// #region NativeToolbarButton

export interface NativeToolbarButtonProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  icon?: SFSymbol;
  image?: ImageRef;
  onPress?: () => void;
  possibleTitles?: string[];
  selected?: boolean;
  separateBackground?: boolean;
  style?: StyleProp<BasicTextStyle>;
  tintColor?: ColorValue;
  variant?: 'plain' | 'done' | 'prominent';
}

/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
export const NativeToolbarButton: React.FC<NativeToolbarButtonProps> = (props) => {
  const id = useId();
  const areChildrenString = typeof props.children === 'string';
  const label = areChildrenString
    ? (props.children as string)
    : getFirstChildOfType(props.children, Label)?.props.children;
  const iconComponent =
    !props.icon && !areChildrenString ? getFirstChildOfType(props.children, Icon) : undefined;
  const icon =
    props.icon ??
    (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
  const sf = typeof icon === 'string' ? icon : undefined;
  return (
    <RouterToolbarItem
      accessibilityHint={props.accessibilityHint}
      accessibilityLabel={props.accessibilityLabel}
      barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant}
      disabled={props.disabled}
      hidden={props.hidden}
      hidesSharedBackground={props.hidesSharedBackground}
      identifier={id}
      image={props.image}
      onSelected={props.onPress}
      possibleTitles={props.possibleTitles}
      selected={props.selected}
      sharesBackground={!props.separateBackground}
      systemImageName={sf}
      title={label}
      tintColor={props.tintColor}
      titleStyle={StyleSheet.flatten(props.style)}
    />
  );
};

// #endregion

// #region NativeToolbarSpacer

export interface NativeToolbarSpacerProps {
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  sharesBackground?: boolean;
  width?: number;
}

/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
export const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps> = (props) => {
  const id = useId();
  return (
    <RouterToolbarItem
      hidesSharedBackground={props.hidesSharedBackground}
      hidden={props.hidden}
      identifier={id}
      sharesBackground={props.sharesBackground}
      type={props.width ? 'fixedSpacer' : 'fluidSpacer'}
      width={props.width}
    />
  );
};

// #endregion

// #region NativeToolbarSearchBarSlot

export interface NativeToolbarSearchBarSlotProps {
  hidesSharedBackground?: boolean;
  hidden?: boolean;
  sharesBackground?: boolean;
}

/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
export const NativeToolbarSearchBarSlot: React.FC<NativeToolbarSearchBarSlotProps> = ({
  hidesSharedBackground,
  hidden,
  sharesBackground,
}) => {
  const id = useId();
  if (process.env.EXPO_OS !== 'ios' || parseInt(String(Platform.Version).split('.')[0], 10) < 26) {
    return null;
  }
  if (hidden) {
    return null;
  }
  return (
    <RouterToolbarItem
      hidesSharedBackground={hidesSharedBackground}
      identifier={id}
      sharesBackground={sharesBackground}
      type="searchBar"
    />
  );
};

// #endregion

// #region NativeToolbarView

export interface NativeToolbarViewProps {
  children?: ReactNode;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  separateBackground?: boolean;
}

/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
export const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({
  children,
  hidden,
  hidesSharedBackground,
  separateBackground,
}) => {
  const id = useId();
  return (
    <RouterToolbarItem
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      identifier={id}
      sharesBackground={!separateBackground}>
      {children}
    </RouterToolbarItem>
  );
};

// #endregion
