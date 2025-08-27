'use client';

import { requireNativeView } from 'expo';
import { Platform, StyleSheet, type ViewProps } from 'react-native';

const areNativeViewsAvailable =
  process.env.EXPO_OS === 'ios' && !Platform.isTV && global.RN$Bridgeless === true;

export type NativeBottomAccessoryProps = ViewProps;
const NativeBottomAccessoryView: React.ComponentType<NativeBottomAccessoryProps> | null =
  areNativeViewsAvailable
    ? requireNativeView('ExpoRouterBottomAccessory', 'BottomAccessoryNativeView')
    : null;
export function NativeBottomAccessory(props: NativeBottomAccessoryProps) {
  if (!NativeBottomAccessoryView) {
    return null;
  }
  return (
    <NativeBottomAccessoryView
      {...props}
      style={StyleSheet.flatten([props.style, { position: 'absolute' }])}
    />
  );
}
