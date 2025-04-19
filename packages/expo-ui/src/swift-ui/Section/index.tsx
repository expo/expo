import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

export type SectionProps = {
  /**
   * On iOS, section titles are usually capitalized for consistency with platform conventions.
   */
  title?: string;
  children: any;
  style?: StyleProp<ViewStyle>;
};

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props: SectionProps) {
  return <SectionNativeView {...props} />;
}
