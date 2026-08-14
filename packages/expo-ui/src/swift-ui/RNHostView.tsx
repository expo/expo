import { requireNativeView } from 'expo';

import { useIsPresentedInOwnWindow } from '../PresentedContentContext';

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

// `matchContents` reads the hosted content's size out of Yoga, so this view must not stretch to its
// own parent on the cross axis. A stretched box makes the content measure the container instead of
// itself, and under a `matchContents` `Host` that feeds back into the size it came from: the content
// grows by the surrounding chrome on every pass and layout never settles.
const hugCrossAxis = { alignSelf: 'flex-start' } as const;

export function RNHostView(props: RNHostViewProps) {
  // A sheet or popover presents its content in its own view controller, where the React Native
  // surface root is not an ancestor and so dispatches nothing. Hosted content there owns its touches
  // and is the origin it is measured from; native reads this one prop for both, so they agree.
  const layoutRoot = useIsPresentedInOwnWindow();

  return (
    <RNHostNativeView
      {...props}
      layoutRoot={layoutRoot}
      style={props.matchContents ? hugCrossAxis : undefined}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
