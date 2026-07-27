import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface DisclosureGroupProps extends CommonViewModifierProps {
  /**
   * Text label for the disclosure group. Use `DisclosureGroup.Label` for custom label content.
   */
  label?: string;
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

type StateChangeEvent = ViewEvent<'onIsExpandedChange', { isExpanded: boolean }>;

type NativeDisclosureGroupProps = Omit<DisclosureGroupProps, 'onIsExpandedChange'> &
  StateChangeEvent;

const DisclosureGroupNativeView: React.ComponentType<NativeDisclosureGroupProps> =
  requireNativeView('ExpoUI', 'DisclosureGroupView');

function Label({ children }: { children: React.ReactNode }) {
  return <Slot name="label">{children}</Slot>;
}

function DisclosureGroupComponent(props: DisclosureGroupProps) {
  const { onIsExpandedChange, modifiers, ...rest } = props;

  function handleStateChange(event: { nativeEvent: { isExpanded: boolean } }) {
    onIsExpandedChange?.(event.nativeEvent.isExpanded);
  }

  const transformedProps = {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...rest,
  };

  return <DisclosureGroupNativeView {...transformedProps} onIsExpandedChange={handleStateChange} />;
}

DisclosureGroupComponent.Label = Label;

export { DisclosureGroupComponent as DisclosureGroup };
