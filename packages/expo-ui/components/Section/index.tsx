import { StyleProp, ViewStyle } from 'react-native';

export type SectionProps = {
  style?: StyleProp<ViewStyle>;
  title: string;
  children: any;
};

export function Section({ children }: SectionProps) {
  return children;
}
