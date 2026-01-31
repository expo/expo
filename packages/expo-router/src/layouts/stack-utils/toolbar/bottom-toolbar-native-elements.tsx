'use client';
import type { ImageRef } from 'expo-image';
import { useCallback, useId, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  type ColorValue,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { router } from '../../../imperative-api';
import { LinkMenuAction } from '../../../link/elements';
import { NativeLinkPreviewAction } from '../../../link/preview/native';
import {
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_BAR_BUTTON_ITEM_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../../navigationParams';
import { RouterToolbarItem } from '../../../toolbar/native';
import type { Href } from '../../../types';
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
  icon?: SFSymbol;
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display for the menu item.
   */
  image?: ImageRef;
  imageRenderingMode?: 'template' | 'original';
  inline?: boolean;
  label?: string;
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
  label,
  destructive,
  children,
  icon,
  image,
  imageRenderingMode,
  tintColor,
  variant,
  style,
  elementSize,
}) => {
  const identifier = useId();

  const titleStyle = StyleSheet.flatten(style);
  const renderingMode = imageRenderingMode ?? (tintColor !== undefined ? 'template' : 'original');
  return (
    <NativeLinkPreviewAction
      sharesBackground={!separateBackground}
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      icon={icon}
      // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
      image={image}
      imageRenderingMode={renderingMode}
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
      title={title ?? ''}
      label={label}
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
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  icon?: SFSymbol;
  image?: ImageRef;
  imageRenderingMode?: 'template' | 'original';
  onPress?: () => void;
  possibleTitles?: string[];
  selected?: boolean;
  separateBackground?: boolean;
  style?: StyleProp<BasicTextStyle>;
  tintColor?: ColorValue;
  variant?: 'plain' | 'done' | 'prominent';
  label?: string;
}

/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
export const NativeToolbarButton: React.FC<NativeToolbarButtonProps> = (props) => {
  const id = useId();
  const renderingMode =
    props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');
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
      imageRenderingMode={renderingMode}
      onSelected={props.onPress}
      possibleTitles={props.possibleTitles}
      selected={props.selected}
      sharesBackground={!props.separateBackground}
      systemImageName={props.icon}
      title={props.label}
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
  separateBackground?: boolean;
}

/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
export const NativeToolbarSearchBarSlot: React.FC<NativeToolbarSearchBarSlotProps> = ({
  hidesSharedBackground,
  hidden,
  separateBackground,
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
      sharesBackground={!separateBackground}
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

// #region NativeToolbarLink

export interface NativeToolbarLinkProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  href: Href;
  action?: 'push' | 'navigate' | 'replace';
  icon?: SFSymbol;
  image?: ImageRef;
  imageRenderingMode?: 'template' | 'original';
  separateBackground?: boolean;
  style?: StyleProp<BasicTextStyle>;
  tintColor?: ColorValue;
  variant?: 'plain' | 'done' | 'prominent';
  label?: string;
}

function resolveHrefWithZoomParams(href: Href, zoomId: string): Href {
  const zoomParams = {
    [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomId,
    [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_BAR_BUTTON_ITEM_ID_PARAM_NAME]: zoomId,
  };

  if (typeof href === 'string') {
    return {
      pathname: href,
      params: zoomParams,
    } as Href;
  }

  return {
    pathname: (href as { pathname?: string }).pathname ?? '',
    params: {
      ...((href as { params?: Record<string, unknown> }).params ?? {}),
      ...zoomParams,
    },
  } as Href;
}

/**
 * Native toolbar link component for bottom toolbar.
 * Renders as RouterToolbarItem and navigates with zoom transition on press.
 */
export const NativeToolbarLink: React.FC<NativeToolbarLinkProps> = (props) => {
  const id = useId();
  const zoomId = useId();

  const handlePress = useCallback(() => {
    const resolvedHref = resolveHrefWithZoomParams(props.href, zoomId);
    const action = props.action ?? 'push';
    router[action](resolvedHref);
  }, [props.href, props.action, zoomId]);

  const renderingMode =
    props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');

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
      imageRenderingMode={renderingMode}
      onSelected={handlePress}
      sharesBackground={!props.separateBackground}
      systemImageName={props.icon}
      title={props.label}
      tintColor={props.tintColor}
      titleStyle={StyleSheet.flatten(props.style)}
      zoomTransitionSourceIdentifier={zoomId}>
      {props.children}
    </RouterToolbarItem>
  );
};

// #endregion
