import { requireNativeView } from 'expo';

const RNHostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHostView');

export interface RNHostViewProps {
  /**
   * When `true`, the RNHost will update its size in the React Native view tree to match the children's size.
   * When `false`, the RNHost will use the size of the parent SwiftUI View.
   * Can be only set once on mount.
   *
   * > **warning** When the hosted children provide the content of a `matchContents` host (for
   * > example, as a `Menu` label), their width must not derive from the width they are granted.
   * > Inside the hosted subtree, avoid `flex: 1`, percentage widths, and the default stretch
   * > alignment (set `alignSelf: 'flex-start'` on the root child), and give wrapping text a
   * > constant `maxWidth`. Grant-dependent sizing creates a layout feedback loop between Yoga
   * > and SwiftUI, and system settings that add chrome around controls, such as the iOS Button
   * > Shapes accessibility setting, make that loop grow without bound.
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
