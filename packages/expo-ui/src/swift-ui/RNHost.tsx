import { requireNativeView } from 'expo';
const HostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHost');

interface RNHostProps {
  matchContents?: boolean;
  children: React.ReactElement;
}

export function RNHost(props: RNHostProps) {
  return (
    <HostNativeView {...props} key={props.matchContents ? 'matchContents' : 'noMatchContents'} />
  );
}
