import { requireNativeView } from 'expo';

import { PresentedContentContext, useIsPresentedInOwnWindow } from '../PresentedContentContext';

const RNHostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHostView');

export interface RNHostViewProps {
  /**
   * When `true`, the RNHost will update its size in the React Native view tree to match the
   * children's size.
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
  // A sheet or popover presents its content in its own view controller, where the React Native
  // surface root is not an ancestor and so touch dispatches don't work.
  // Hosted content there owns its touches and is the origin it is measured from; native reads
  // this one prop for both.
  const layoutRoot = useIsPresentedInOwnWindow();

  return (
    <RNHostNativeView
      {...props}
      layoutRoot={layoutRoot}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}>
      {/* Reset context here so only nearest RNHostView becomes the layout root for its children, and not any other RNHostView above it in the tree. */}
      <PresentedContentContext.Provider value={false}>
        {props.children}
      </PresentedContentContext.Provider>
    </RNHostNativeView>
  );
}
