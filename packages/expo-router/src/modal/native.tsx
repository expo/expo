'use client';

import { requireNativeView } from 'expo';
import { Platform, type ViewProps } from 'react-native';

// #region Portal Host View
export interface HostProps extends ViewProps {
  hostId: string;
  onRegistered?: (event: { nativeEvent: { hostId: string } }) => void;
  onUnregistered?: (event: { nativeEvent: { hostId: string } }) => void;
}

const supportedPlatforms = ['ios', 'android'] as const;

const isPlatformSupported = (supportedPlatforms as readonly string[]).includes(Platform.OS);

const NativeModalPortalHostView: React.ComponentType<HostProps> | null = isPlatformSupported
  ? requireNativeView('ExpoRouterModalPortal', 'ModalPortalHostView')
  : null;

export function NativeModalPortalHost(props: HostProps) {
  if (!NativeModalPortalHostView) {
    return null;
  }
  return <NativeModalPortalHostView {...props} />;
}
// #endregion

// #region Portal Content View Wrapper
export interface ContentWrapperProps {
  hostId: string;
  children: React.ReactNode;
}
const NativeModalPortalContentWrapperView: React.ComponentType<
  ContentWrapperProps & ViewProps
> | null = isPlatformSupported
  ? requireNativeView('ExpoRouterModalPortal', 'ModalPortalContentWrapperView')
  : null;
export function NativeModalPortalContentWrapper(props: ContentWrapperProps) {
  if (!NativeModalPortalContentWrapperView) {
    return null;
  }
  return <NativeModalPortalContentWrapperView {...props} style={{ position: 'absolute' }} />;
}
// #endregion

// #region Portal Content View
export interface ContentProps extends ViewProps {}
const NativeModalPortalContentView: React.ComponentType<ContentProps> | null = isPlatformSupported
  ? requireNativeView('ExpoRouterModalPortal', 'ModalPortalContentView')
  : null;
export function NativeModalPortalContent(props: ContentProps) {
  if (!NativeModalPortalContentView) {
    return null;
  }
  return <NativeModalPortalContentView {...props} />;
}
// #endregion
