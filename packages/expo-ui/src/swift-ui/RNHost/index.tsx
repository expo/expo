import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type RNHostProps = {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from React Native.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };

  children: React.ReactNode;
} & CommonViewModifierProps;

const RNHostNativeView: React.ComponentType<
  RNHostProps & { matchContentsVertical?: boolean; matchContentsHorizontal?: boolean }
> = requireNativeView('ExpoUI', 'RNHost');

/**
 * A hosting component for React Native views in SwiftUI.
 * Use it to host React Native components in SwiftUI components.
 * This sets its own shadow node size so child RN components properties like flex: 1 work as expected.
 * This also listens to child RN view's bounds and sets frame modifier on it, so its sizing can be controlled by Yoga.
 */
export function RNHost(props: RNHostProps) {
  const { matchContents, modifiers, ...restProps } = props;
  const matchContentsVertical =
    typeof matchContents === 'object' ? matchContents.vertical : matchContents;
  const matchContentsHorizontal =
    typeof matchContents === 'object' ? matchContents.horizontal : matchContents;

  return (
    <RNHostNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      matchContentsVertical={matchContentsVertical}
      matchContentsHorizontal={matchContentsHorizontal}
      // matchContents do not work dynamically, so we remount the component when the matchContents changes
      key={`matchContentsVertical=${matchContentsVertical}-matchContentsHorizontal=${matchContentsHorizontal}`}
      {...restProps}
    />
  );
}
