import { requireNativeView } from 'expo';
import { type ReactNode } from 'react';

import { Slot } from '../SlotView';
import { type ContentAlignment, type PrimitiveBaseProps, transformProps } from '../layout-types';

export type MaskProps = {
  children?: ReactNode;
  /**
   * Alignment of the mask content within the masked view's bounds.
   * @default 'center'
   */
  alignment?: ContentAlignment;
} & PrimitiveBaseProps;

const MaskNativeView: React.ComponentType<MaskProps> = requireNativeView('ExpoUI', 'MaskView');

function MaskContent(props: { children: ReactNode }) {
  return <Slot slotName="content">{props.children}</Slot>;
}

Mask.Content = MaskContent;

export function Mask(props: MaskProps) {
  return <MaskNativeView {...transformProps(props)} />;
}
