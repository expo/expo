import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

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
  onIsExpandedChange?: (isExpanded: boolean) => void;
}

type StateChangeEvent = ViewEvent<'on', { isExpanded: boolean }>;

type NativeDisclosureGroupProps = Omit<DisclosureGroupProps, 'on'> & StateChangeEvent;

const DisclosureGroupNativeView: React.ComponentType<NativeDisclosureGroupProps> =
  requireNativeView('ExpoUI', 'DisclosureGroupView');

export function DisclosureGroup(props: DisclosureGroupProps) {
  const { onIsExpandedChange, modifiers, ...rest } = props;

  function handleStateChange(event: { nativeEvent: { isExpanded: boolean } }) {
    onIsExpandedChange?.(event.nativeEvent.isExpanded);
  }

  const transformedProps = {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...rest,
  };

  return <DisclosureGroupNativeView {...transformedProps} on={handleStateChange} />;
}
