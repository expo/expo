import { requireNativeView } from 'expo';
import { SectionProps } from './index';

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

export function Section(props: SectionProps) {
  return <SectionNativeView {...props} />;
}
