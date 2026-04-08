import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export type OverlayProps = {
  children: React.ReactNode;
  /**
   * The alignment of the overlay content relative to the trigger view.
   * @default 'center'
   */
  alignment?: Alignment;
} & CommonViewModifierProps;

const OverlayNativeView: React.ComponentType<OverlayProps> = requireNativeView(
  'ExpoUI',
  'OverlayView'
);

function OverlayTrigger(props: { children: React.ReactNode }) {
  return <Slot name="trigger">{props.children}</Slot>;
}

function OverlayContent(props: { children: React.ReactNode }) {
  return <Slot name="content">{props.children}</Slot>;
}

Overlay.Trigger = OverlayTrigger;
Overlay.Content = OverlayContent;

export function Overlay(props: OverlayProps) {
  const { modifiers, children, ...restProps } = props;

  return (
    <OverlayNativeView
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </OverlayNativeView>
  );
}
