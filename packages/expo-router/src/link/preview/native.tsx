'use client';

import { requireNativeView } from 'expo';
import { StyleSheet, type ViewProps } from 'react-native';

const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && global.RN$Bridgeless === true;

// #region Action View
export interface NativeLinkPreviewActionProps {
  title: string;
  icon?: string;
  id: string;
  children?: React.ReactNode;
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

// #region Trigger View
export type NativeLinkPreviewTriggerProps = ViewProps;
const NativeLinkPreviewTriggerView: React.ComponentType<NativeLinkPreviewTriggerProps> | null =
  areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewTrigger')
    : null;
export function NativeLinkPreviewTrigger(props: NativeLinkPreviewTriggerProps) {
  if (!NativeLinkPreviewTriggerView) {
    return null;
  }
  return <NativeLinkPreviewTriggerView {...props} />;
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
  onActionSelected?: (event: { nativeEvent: { id: string } }) => void;
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
    } as const,
  ]);
  return <NativeLinkPreviewContentView {...props} style={style} />;
}
// #endregion
