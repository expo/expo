import { requireOptionalNative } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface GroupProps extends CommonViewModifierProps {
  children: React.ReactNode;
}

// Only iOS has native views in `expo.packages`. Android also loads this file
// (through `@expo/ui/swift-ui`), and there `requireNative` would throw.
const GroupNativeView: React.ComponentType<GroupProps> =
  requireOptionalNative('@expo/ui')?.GroupView;

export function Group(props: GroupProps) {
  const { modifiers, ...restProps } = props;
  return (
    <GroupNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
