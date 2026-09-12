import type { ComponentProps } from 'react';

import { NativeStackView as RNNativeStackView } from '../../react-navigation/native-stack';

export function NativeStackView(props: ComponentProps<typeof RNNativeStackView>) {
  return <RNNativeStackView {...props} />;
}
