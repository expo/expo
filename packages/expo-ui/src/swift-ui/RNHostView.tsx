import { requireNativeView } from 'expo';

const RNHostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHostView');

export interface RNHostViewProps {
  /**
   * When `true`, the RNHost will update its size in the React Native view tree to match the children's size.
   * When `false`, the RNHost will use the size of the parent SwiftUI View.
   * Can be only set once on mount.
   *
   * > **Note:** `matchContents` only works when the child has a natural size of its own. If the
   * > child just fills whatever space it is given (`flex: 1`, percentage widths, or text that
   * > wraps to the available width), SwiftUI and Yoga keep resizing each other and layout can
   * > loop forever. Let the child size to its content instead, for example with
   * > `alignSelf: 'flex-start'`, and give long text a `maxWidth`.
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
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
