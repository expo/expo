import { requireNativeView } from 'expo';
const RNHostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHost');

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
    <RNHostNativeView
      {...props}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
