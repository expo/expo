import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export type OverlayProps = {
  children: React.ReactNode;
  /**
   * The alignment of the overlay content relative to the base content.
   * @default 'center'
   */
  alignment?: Alignment;
} & CommonViewModifierProps;

const OverlayNativeView: React.ComponentType<OverlayProps> = requireNativeView(
  'ExpoUI',
  'OverlayView'
);

function OverlayContent(props: { children: React.ReactNode }) {
  return <Slot name="content">{props.children}</Slot>;
}

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
