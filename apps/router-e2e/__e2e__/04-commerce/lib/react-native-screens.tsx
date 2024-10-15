'use client';

import React from 'react';
import {
  NativeScreen as RNNativeScreen,
  NativeScreenContainer as RNNativeScreenContainer,
  ScreenStack as RNScreenStack,
  ScreenStackHeaderConfig,
  Screen as RNScreen,
} from 'react-native-screens';

function rewrap<T>(Component: React.ComponentType<T>) {
  return (props: T) => <Component {...props} />;
}

// RSC doesn't support components that are directly exported as `codegenNativeComponent('RNSScreen')`.
// React Native should support lowercase native components so we can define them as `<nativeScreenContainer />`.
export function NativeScreen(props: React.ComponentProps<typeof RNNativeScreen>) {
  return <RNNativeScreen {...props} />;
}

export const NativeScreenContainer = rewrap(RNNativeScreenContainer);
export const ScreenStack = rewrap(RNScreenStack);
export const Screen = rewrap(RNScreen);

export { ScreenStackHeaderConfig };
