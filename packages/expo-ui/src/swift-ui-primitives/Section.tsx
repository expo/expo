import { requireNativeView } from 'expo';

export type SectionProps = {
  title?: string;
  children: React.ReactNode;
};

const SectionNativeView: React.ComponentType<SectionProps> = requireNativeView(
  'ExpoUI',
  'SectionPrimitiveView'
);

export function Section(props: SectionProps) {
  return <SectionNativeView {...props} />;
}
