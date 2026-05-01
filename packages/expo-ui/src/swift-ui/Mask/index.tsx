import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export type MaskProps = {
  children: React.ReactNode;
  /**
   * The alignment of the mask content relative to the base content.
   * @default 'center'
   */
  alignment?: Alignment;
} & CommonViewModifierProps;

const MaskNativeView: React.ComponentType<MaskProps> = requireNativeView('ExpoUI', 'MaskView');

function MaskContent(props: { children: React.ReactNode }) {
  return <Slot name="content">{props.children}</Slot>;
}

Mask.Content = MaskContent;

export function Mask(props: MaskProps) {
  const { modifiers, children, ...restProps } = props;

  return (
    <MaskNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </MaskNativeView>
  );
}
