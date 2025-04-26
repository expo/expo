import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { Host } from '../Host';

export type SectionProps = {
  /**
   * On iOS, section titles are usually capitalized for consistency with platform conventions.
   */
  title?: string;
  children: any;
};

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

/**
 * `<Section>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function SectionPrimitive(props: SectionProps) {
  return <SectionNativeView {...props} />;
}

/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props: SectionProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <SectionPrimitive {...props} />
    </Host>
  );
}
