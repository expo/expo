import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from './types';
import { type ViewEvent } from '../types';

export interface DisclosureGroupProps extends CommonViewModifierProps {
  label: string;
  children: React.ReactNode;
  /**
   * Controls whether the disclosure group is expanded.
   */
  isExpanded?: boolean;
  /**
   * A callback that is called when the expansion state changes.
   */
  onStateChange?: (isExpanded: boolean) => void;
}

type StateChangeEvent = ViewEvent<'onStateChange', { isExpanded: boolean }>;

export type NativeDisclosureGroupProps = Omit<DisclosureGroupProps, 'onStateChange'> &
  StateChangeEvent;

const DisclosureGroupNativeView: React.ComponentType<NativeDisclosureGroupProps> =
  requireNativeView('ExpoUI', 'DisclosureGroupView');

export function DisclosureGroup(props: DisclosureGroupProps) {
  const { onStateChange, ...rest } = props;

  function handleStateChange(event: { nativeEvent: { isExpanded: boolean } }) {
    onStateChange?.(event.nativeEvent.isExpanded);
  }

  return <DisclosureGroupNativeView {...rest} onStateChange={handleStateChange} />;
}
