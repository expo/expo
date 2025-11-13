'use client';

import { requireNativeView } from 'expo';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

const areNativeViewsAvailable =
  process.env.EXPO_OS === 'ios' && !Platform.isTV && global.RN$Bridgeless === true;

// #region Action View
export interface NativeLinkPreviewActionProps {
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

const LinkPreviewNativeZoomTransitionEnablerView: React.ComponentType<
  ViewProps & { zoomTransitionSourceIdentifier: string }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeZoomTransitionEnabler')
  : null;
export function LinkPreviewNativeZoomTransitionEnabler(
  props: PropsWithChildren<{ zoomTransitionSourceIdentifier: string }>
) {
  if (!LinkPreviewNativeZoomTransitionEnablerView) {
    return null;
  }
  return (
    <LinkPreviewNativeZoomTransitionEnablerView
      {...props}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        backgroundColor: 'transparent',
      }}
    />
  );
}

const LinkPreviewNativeZoomTransitionSourceView: React.ComponentType<
  ViewProps & { identifier: string; disableForceFlatten?: boolean }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeZoomTransitionSource')
  : null;
export function LinkPreviewNativeZoomTransitionSource(props: {
  identifier: string;
  children: React.ReactNode;
}) {
  if (!LinkPreviewNativeZoomTransitionSourceView) {
    return null;
  }
  return (
    <LinkPreviewNativeZoomTransitionSourceView
      {...props}
      style={{ display: 'contents' }}
      disableForceFlatten
    />
  );
}

const RouterToolbarHostView: React.ComponentType<ViewProps> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'RouterToolbarHost')
  : null;
export function RouterToolbarHost(props: PropsWithChildren) {
  if (!RouterToolbarHostView) {
    return null;
  }
  return (
    <RouterToolbarHostView
      {...props}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        backgroundColor: 'transparent',
      }}
    />
  );
}

const RouterToolbarItemView: React.ComponentType<
  ViewProps & { identifier: string; title?: string; systemImageName?: SFSymbol; type?: string }
> | null = areNativeViewsAvailable
  ? requireNativeView('ExpoRouterNativeLinkPreview', 'RouterToolbarItem')
  : null;
export function RouterToolbarItem(props: {
  identifier: string;
  title?: string;
  systemImageName?: SFSymbol;
  spacer?: boolean;
}) {
  if (!RouterToolbarItemView) {
    return null;
  }
  return <RouterToolbarItemView {...props} type={props.spacer ? 'spacer' : ''} />;
}

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
