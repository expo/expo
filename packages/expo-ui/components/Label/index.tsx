import { requireNativeView } from 'expo';
import { StyleProp, View, ViewStyle } from 'react-native';

export type LabelProps = {
  title?: string;
  systemImage: string;
  style?: StyleProp<ViewStyle>;
};

const LabelNativeView: React.ComponentType<LabelProps> = requireNativeView('ExpoUI', 'LabelView');

export function Label(props: LabelProps) {
  return <LabelNativeView {...props} />;
}
