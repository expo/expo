import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type SingleChoiceSegmentedControlProps = {
  options: string[];
  selectedIndex: number | null;
  onOptionSelected: (event: { nativeEvent: { index: number; label: string } }) => void;
  style?: StyleProp<ViewStyle>;
};

const NativeView: React.ComponentType<SingleChoiceSegmentedControlProps> = requireNativeView(
  'ExpoUI',
  'SingleChoiceSegmentedControlView'
);

export default function ExpoUIView(props: SingleChoiceSegmentedControlProps) {
  return <NativeView {...props} />;
}
