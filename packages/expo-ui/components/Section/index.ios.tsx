import { requireNativeView } from 'expo';

import { SectionProps } from '.';

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

export function Section(props: SectionProps) {
  return <SectionNativeView {...props} />;
}
