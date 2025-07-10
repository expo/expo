'use client';

import { requireNativeView } from 'expo';
import { Platform, StyleSheet, type ViewProps } from 'react-native';

// #region Action View
export interface NativeLinkPreviewActionProps {
  title: string;
  icon?: string;
  id: string;
  children?: React.ReactNode;
}
const LinkPreviewNativeActionView: React.ComponentType<NativeLinkPreviewActionProps> | null =
  Platform.OS === 'ios'
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
  Platform.OS === 'ios'
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
export interface NativeLinkPreviewProps extends ViewProps {
  nextScreenId: string | undefined;
  onActionSelected?: (event: { nativeEvent: { id: string } }) => void;
  onWillPreviewOpen?: () => void;
  onDidPreviewOpen?: () => void;
  onPreviewWillClose?: () => void;
  onPreviewDidClose?: () => void;
  onPreviewTapped?: () => void;
  children: React.ReactNode;
}
const NativeLinkPreviewView: React.ComponentType<NativeLinkPreviewProps> | null =
  Platform.OS === 'ios'
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
  Platform.OS === 'ios'
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
