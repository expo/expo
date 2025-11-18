'use client';

import { requireNativeView } from 'expo';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';

const areNativeViewsAvailable =
  process.env.EXPO_OS === 'ios' && !Platform.isTV && global.RN$Bridgeless === true;

// #region Action View
export interface NativeLinkPreviewActionProps {
  identifier: string;
  title: string;
  icon?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  // This may lead to race conditions, when two menu actions are on at the same time.
  // The logic should be enforced in the JS code, rather than in the native code.
  // singleSelection?: boolean;
  displayAsPalette?: boolean;
  displayInline?: boolean;
  isOn?: boolean;
  // There are issues with menu state updates when keep presented is set to true.
  // When updating the context menu state, it will either not update or it will recreate the menu. The latter is a problem,
  // because it will close all opened submenus and reset the scroll position.
  // TODO: (@ubax) find a way to fix this.
  keepPresented?: boolean;
  onSelected: () => void;
}
const LinkPreviewNativeActionView: React.ComponentType<NativeLinkPreviewActionProps> | null =
  areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
    : null;
export function NativeLinkPreviewAction(props: NativeLinkPreviewActionProps) {
  if (!LinkPreviewNativeActionView) {
    return null;
  }
  return <LinkPreviewNativeActionView {...props} />;
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
  disableForceFlatten?: boolean;
  onWillPreviewOpen?: () => void;
  onDidPreviewOpen?: () => void;
  onPreviewWillClose?: () => void;
  onPreviewDidClose?: () => void;
  onPreviewTapped?: () => void;
  onPreviewTappedAnimationCompleted?: () => void;
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
  preferredContentSize?: { width: number; height: number };
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

// #region Zoom transition
const LinkZoomTransitionEnablerNativeView: React.ComponentType<
  ViewProps & { zoomTransitionSourceIdentifier: string; disableForceFlatten?: boolean }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionEnabler')
  : null;
export function LinkZoomTransitionEnabler(props: { zoomTransitionSourceIdentifier: string }) {
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

interface LinkSourceAlignmentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const LinkZoomTransitionSourceNativeView: React.ComponentType<
  ViewProps & {
    identifier: string;
    disableForceFlatten?: boolean;
    alignment?: LinkSourceAlignmentRect;
  }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionSource')
  : null;
export function LinkZoomTransitionSource(
  props: PropsWithChildren<{ identifier: string; alignment?: LinkSourceAlignmentRect }>
) {
  if (!LinkZoomTransitionSourceNativeView) {
    return null;
  }
  return (
    <LinkZoomTransitionSourceNativeView
      {...props}
      disableForceFlatten
      style={{ display: 'contents' }}
    />
  );
}
// #endregion
