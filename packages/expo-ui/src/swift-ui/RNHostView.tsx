import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from './modifiers/utils';
import { type CommonViewModifierProps } from './types';

const RNHostNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'RNHostView');

export interface RNHostViewProps extends CommonViewModifierProps {
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
  const { modifiers, ...restProps } = props;
  return (
    <RNHostNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
