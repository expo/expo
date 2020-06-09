import * as React from 'react';
import { View } from 'react-native';

import { NativeLinearGradientProps } from './NativeLinearGradient.types';

// This is a shim view for platforms that aren't supported by Expo.
// The component and prop types should match all of the other platform variations.
export default function NativeLinearGradient(props: NativeLinearGradientProps): React.ReactElement {
  const { colors, locations, startPoint, endPoint, ...viewProps } = props;
  console.warn('LinearGradient is not available on this platform');
  return <View {...(viewProps as any)} />;
}
