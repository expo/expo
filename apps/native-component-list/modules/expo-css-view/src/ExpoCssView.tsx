import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoCssViewProps } from './ExpoCssView.types';

const NativeView: React.ComponentType<ExpoCssViewProps> =
  requireNativeView('ExpoCssView');

export default function ExpoCssView(props: ExpoCssViewProps) {
  return <NativeView {...props} />;
}
