import * as React from 'react';
import { View } from 'react-native';
import { NativeSafeAreaProviderProps } from './SafeArea.types';
import useWindowDimensions from './useWindowDimensions';

export function CompatNativeSafeAreaProvider({
  children,
  style,
  onInsetsChange,
}: NativeSafeAreaProviderProps) {
  const window = useWindowDimensions();
  React.useEffect(() => {
    const insets = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
    const frame = {
      x: 0,
      y: 0,
      width: window.width,
      height: window.height,
    };
    // @ts-ignore: missing properties
    onInsetsChange({ nativeEvent: { insets, frame } });
  }, [onInsetsChange, window.height, window.width]);
  return <View style={style}>{children}</View>;
}
