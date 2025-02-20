import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

export type SectionProps = {
  title: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

export function Section(props: SectionProps) {
  return <SectionNativeView {...props} />;
}
