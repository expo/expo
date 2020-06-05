import React, { FC } from 'react';
import { View } from 'react-native';

// This is a shim view for platforms that aren't supported by Expo
const NativeLinearGradient: FC<any> = (props: any) => {
  console.warn('LinearGradient is not available on this platform');
  return <View {...props} />;
};

export default NativeLinearGradient;
