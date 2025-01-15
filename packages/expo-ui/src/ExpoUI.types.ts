import type { StyleProp, ViewStyle } from 'react-native';

export type ExpoUIViewProps = {
  options: string[];
  selectedIndex: number | null;
  onOptionSelected: (event: { nativeEvent: { index: number; label: string } }) => void;
  style?: StyleProp<ViewStyle>;
};
