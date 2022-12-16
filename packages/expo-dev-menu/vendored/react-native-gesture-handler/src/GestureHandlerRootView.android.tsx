import * as React from 'react';
import { requireNativeComponent } from 'react-native';
import { GestureHandlerRootViewProps } from './GestureHandlerRootView';

const GestureHandlerRootViewNative = requireNativeComponent(
  'GestureHandlerRootView'
);
  
export default function GestureHandlerRootView({
  children,
  ...rest
}: GestureHandlerRootViewProps) {
  return (
    <GestureHandlerRootViewNative {...rest}>
      {children}
    </GestureHandlerRootViewNative>
  );
}
