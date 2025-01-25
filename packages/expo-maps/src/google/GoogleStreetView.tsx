import { requireNativeView } from 'expo';
import * as React from 'react';

import { StreetViewProps } from './GoogleMaps.types';

const NativeView: React.ComponentType<StreetViewProps> = requireNativeView('ExpoGoogleStreetView');

export function StreetView(props: StreetViewProps) {
  return <NativeView {...props} />;
}
