import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { GoogleStreetViewProps } from './GoogleMaps.types';

let NativeView: React.ComponentType<GoogleStreetViewProps> | null = null;

if (Platform.OS === 'android') {
  NativeView = requireNativeView('ExpoGoogleStreetView');
}

/**
 * @platform android
 */
export function GoogleStreetView(props: GoogleStreetViewProps) {
  if (!NativeView) {
    return null;
  }
  return <NativeView {...props} />;
}
