import { requireNativeView } from 'expo';

const NativeNamespaceProviderView: React.ComponentType<{ children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'NamespaceProvider');

export function NamespaceProvider(props: { children: React.ReactNode }) {
  return <NativeNamespaceProviderView {...props} />;
}
