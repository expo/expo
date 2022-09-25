import * as React from 'react';
import { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';

export interface GestureHandlerRootViewProps
  extends PropsWithChildren<ViewProps> {}

export default function GestureHandlerRootView({
  ...rest
}: GestureHandlerRootViewProps) {
  return <View {...rest} />;
}
