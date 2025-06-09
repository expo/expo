import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from './types';

export interface DisclosureGroupProps extends CommonViewModifierProps {
  label: string;
  children: React.ReactNode;
}

const DisclosureGroupNativeView: React.ComponentType<DisclosureGroupProps> = requireNativeView(
  'ExpoUI',
  'DisclosureGroupView'
);

export function DisclosureGroup(props: DisclosureGroupProps) {
  return <DisclosureGroupNativeView {...props} />;
}
