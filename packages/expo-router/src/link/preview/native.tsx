'use client';

import { requireNativeView } from 'expo';
import type { ImageRef } from 'expo-image';
import { Fragment, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, type ViewProps, type ColorValue } from 'react-native';

import type { BasicTextStyle } from '../../utils/font';

const areNativeViewsAvailable =
  process.env.EXPO_OS === 'ios' && !Platform.isTV && global.RN$Bridgeless === true;

// #region Action View
export interface NativeLinkPreviewActionProps {
  identifier: string;
  title: string;
  label?: string | undefined;
  icon?: string | undefined;
  xcassetName?: string | undefined;
  image?: ImageRef | null | undefined;
  imageRenderingMode?: 'template' | 'original' | undefined;
  children?: React.ReactNode | undefined;
  disabled?: boolean | undefined;
  destructive?: boolean | undefined;
  discoverabilityLabel?: string | undefined;
  subtitle?: string | undefined;
  accessibilityLabel?: string | undefined;
  accessibilityHint?: string | undefined;
  // This may lead to race conditions, when two menu actions are on at the same time.
  // The logic should be enforced in the JS code, rather than in the native code.
  // singleSelection?: boolean;
  displayAsPalette?: boolean | undefined;
  displayInline?: boolean | undefined;
  preferredElementSize?: 'auto' | 'small' | 'medium' | 'large' | undefined;
  isOn?: boolean | undefined;
  // There are issues with menu state updates when keep presented is set to true.
  // When updating the context menu state, it will either not update or it will recreate the menu. The latter is a problem,
  // because it will close all opened submenus and reset the scroll position.
  // TODO: (@ubax) find a way to fix this.
  keepPresented?: boolean | undefined;
  hidden?: boolean | undefined;
  tintColor?: ColorValue | undefined;
  barButtonItemStyle?: 'plain' | 'prominent' | undefined;

  // These properties are for UIBarButtonItem compatibility but don't apply to context menus.
  // They're included for API consistency with toolbar items.
  sharesBackground?: boolean | undefined;
  hidesSharedBackground?: boolean | undefined;
  onSelected: () => void;
  titleStyle?: BasicTextStyle | undefined;
}
const LinkPreviewNativeActionView: React.ComponentType<
  Omit<NativeLinkPreviewActionProps, 'image'> & { image?: number }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
  : null;
export function NativeLinkPreviewAction(props: NativeLinkPreviewActionProps) {
  if (!LinkPreviewNativeActionView) {
    return null;
  }
  // Needed to pass shared object ID to native side
  const imageObjectId = (
    props.image as
      | {
          __expo_shared_object_id__: number;
        }
      | undefined
  )?.__expo_shared_object_id__;
  // @ts-expect-error -- external library types are not exactOptionalPropertyTypes-compatible
  return <LinkPreviewNativeActionView {...props} image={imageObjectId} />;
}
// #endregion

// #region Preview View
export interface TabPath {
  oldTabKey: string;
  newTabKey: string;
}
export interface NativeLinkPreviewProps extends ViewProps {
  nextScreenId: string | undefined;
  tabPath:
    | {
        path: TabPath[];
      }
    | undefined;
  disableForceFlatten?: boolean | undefined;
  onWillPreviewOpen?: (() => void) | undefined;
  onDidPreviewOpen?: (() => void) | undefined;
  onPreviewWillClose?: (() => void) | undefined;
  onPreviewDidClose?: (() => void) | undefined;
  onPreviewTapped?: (() => void) | undefined;
  onPreviewTappedAnimationCompleted?: (() => void) | undefined;
  children: React.ReactNode;
}
const NativeLinkPreviewView: React.ComponentType<NativeLinkPreviewProps> | null =
  areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewView')
    : null;
export function NativeLinkPreview(props: NativeLinkPreviewProps) {
  if (!NativeLinkPreviewView) {
    return null;
  }
  return <NativeLinkPreviewView {...props} />;
}
// #endregion

// #region Preview Content View
export interface NativeLinkPreviewContentProps extends ViewProps {
  preferredContentSize?: { width: number; height: number } | undefined;
}
const NativeLinkPreviewContentView: React.ComponentType<NativeLinkPreviewContentProps> | null =
  areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewContentView')
    : null;

export function NativeLinkPreviewContent(props: NativeLinkPreviewContentProps) {
  if (!NativeLinkPreviewContentView) {
    return null;
  }
  const style = StyleSheet.flatten([
    props.style,
    {
      position: 'absolute',
      top: 0,
      left: 0,
    } as const,
  ]);
  return <NativeLinkPreviewContentView {...props} style={style} />;
}
// #endregion

// #region Zoom transition enabler
interface DismissalBoundsRect {
  minX?: number | undefined;
  maxX?: number | undefined;
  minY?: number | undefined;
  maxY?: number | undefined;
}
const LinkZoomTransitionEnablerNativeView: React.ComponentType<
  ViewProps & { zoomTransitionSourceIdentifier: string; disableForceFlatten?: boolean }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionEnabler')
  : null;
export function LinkZoomTransitionEnabler(props: {
  zoomTransitionSourceIdentifier: string;
  dismissalBoundsRect?: DismissalBoundsRect | null;
}) {
  if (!LinkZoomTransitionEnablerNativeView) {
    return null;
  }
  return (
    <LinkZoomTransitionEnablerNativeView
      {...props}
      disableForceFlatten
      style={{ display: 'contents' }}
    />
  );
}
// #endregion

// #region Zoom transition source
interface LinkSourceAlignmentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LinkZoomTransitionSourceProps extends PropsWithChildren {
  identifier: string;
  alignment?: LinkSourceAlignmentRect | undefined;
  animateAspectRatioChange?: boolean | undefined;
}

interface LinkZoomTransitionSourceNativeProps extends ViewProps, LinkZoomTransitionSourceProps {
  disableForceFlatten?: boolean | undefined;
}

const LinkZoomTransitionSourceNativeView: React.ComponentType<LinkZoomTransitionSourceNativeProps> | null =
  areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionSource')
    : null;
export function LinkZoomTransitionSource(props: LinkZoomTransitionSourceProps) {
  if (!LinkZoomTransitionSourceNativeView) {
    return null;
  }
  return (
    <LinkZoomTransitionSourceNativeView
      {...props}
      disableForceFlatten
      collapsable={false}
      collapsableChildren={false}
      style={{ display: 'contents' }}
    />
  );
}
// #endregion

// #region Zoom transition rect detector
const LinkZoomTransitionAlignmentRectDetectorNative: React.ComponentType<
  ViewProps & { identifier: string; disableForceFlatten?: boolean; children?: React.ReactNode }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionAlignmentRectDetector')
  : Fragment;
export function LinkZoomTransitionAlignmentRectDetector(props: {
  identifier: string;
  children: React.ReactNode;
}) {
  if (!LinkZoomTransitionAlignmentRectDetectorNative) {
    return null;
  }
  return (
    <LinkZoomTransitionAlignmentRectDetectorNative
      {...props}
      disableForceFlatten
      collapsable={false}
      collapsableChildren={false}
      style={{ display: 'contents' }}
    />
  );
}
// #endregion
