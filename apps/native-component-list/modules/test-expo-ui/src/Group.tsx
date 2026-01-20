import { requireNativeView } from 'expo';
import * as React from 'react';
import { type CommonViewModifierProps } from '@expo/ui/swift-ui';

export interface GroupProps extends CommonViewModifierProps {
  children?: React.ReactNode;
}

const GroupNativeView: React.ComponentType<GroupProps> = requireNativeView(
  'TestExpoUi',
  'TestGroupView'
);

export function Group(props: GroupProps) {
  return <GroupNativeView {...props} />;
}
