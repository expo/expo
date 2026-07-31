import { requireNativeView } from 'expo';

const RNHostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHostView');

export interface RNHostViewProps {
  /**
   * When `true`, the RNHost will update its size in the React Native view tree to match the children's size.
   * When `false`, the RNHost will use the size of the parent SwiftUI View.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean;
  /**
   * The RN View to be hosted.
   */
  children: React.ReactElement;
}

export function RNHostView(props: RNHostViewProps) {
  return (
    <RNHostNativeView
      {...props}
      // The host dispatches touches to the hosted content from its own touch handler, so touch
      // coordinates are relative to the host. Mark the shadow node as a layout root so `measure()`
      // reports the same coordinate space; otherwise `Pressable` cancels the press on any movement.
      layoutRoot
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
