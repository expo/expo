import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoMapsProps } from './ExpoMapsView.types';

const NativeView: React.ComponentType<ExpoMapsProps> = requireNativeView('ExpoMapsRemake');

export default function ExpoMapsView(props: ExpoMapsProps) {
  return <NativeView {...props} />;
}
