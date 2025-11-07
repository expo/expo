import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type RNHostProps = {
  children: React.ReactElement;
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
  const { modifiers, ...restProps } = props;

  return (
    <RNHostNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
