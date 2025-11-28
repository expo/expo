import { requireNativeView } from 'expo';
const HostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHost');

interface RNHostProps {
  /**
   * When true, the RNHost will update its size in the React Native view tree to match the children's size.
   * When false, the RNHost will use the size of the parent SwiftUI View.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean;
  /**
   * The RN View to be hosted.
   */
  children: React.ReactElement;
}

export function RNHost(props: RNHostProps) {
  return (
    <HostNativeView
      {...props}
      // matchContents should only be used once on mount
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
