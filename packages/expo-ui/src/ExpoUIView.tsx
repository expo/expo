import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoUIViewProps } from './ExpoUI.types';

const NativeView: React.ComponentType<ExpoUIViewProps> = requireNativeView('ExpoUI');

export default function ExpoUIView(props: ExpoUIViewProps) {
  return <NativeView {...props} />;
}
