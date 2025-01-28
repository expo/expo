import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { StreetViewProps } from './GoogleMaps.types';

let NativeView: React.ComponentType<StreetViewProps> | null = null;

if (Platform.OS === 'android') {
  NativeView = requireNativeView('ExpoGoogleStreetView');
}

export function StreetView(props: StreetViewProps) {
  if (!NativeView) {
    return null;
  }
  return <NativeView {...props} />;
}
