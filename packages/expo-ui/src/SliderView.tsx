import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  steps?: number;
  onValueChanged: (event: { nativeEvent: { value: number } }) => void;
  style?: StyleProp<ViewStyle>;
};

const NativeView: React.ComponentType<SliderProps> = requireNativeView('ExpoUI', 'SliderView');

export default function ExpoUIView(props: SliderProps) {
  return <NativeView {...props} />;
}
