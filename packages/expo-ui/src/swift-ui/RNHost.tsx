import { requireNativeView } from 'expo';
const HostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHost');

export function RNHost(props: any) {
  return <HostNativeView {...props} />;
}
