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

/**
 * Defines the mask shape applied to `Mask`'s other children. Only opaque pixels
 * of `Mask.Content` are kept; transparent pixels are erased. Exactly one
 * `Mask.Content` should be supplied per `Mask`.
 */
function MaskContent(props: { children: ReactNode }) {
  return <Slot slotName="content">{props.children}</Slot>;
}

Mask.Content = MaskContent;

/**
 * Masks its children using the shape provided via `Mask.Content`.
 *
 * Children of `Mask` are the content being masked; the (single) `Mask.Content`
 * child defines the mask itself — the masked content is visible only where
 * `Mask.Content` is opaque.
 *
 * @example
 * ```tsx
 * <Mask>
 *   <Box modifiers={[size(200, 80), background('#FF3B30')]} />
 *   <Mask.Content>
 *     <Text style={{ fontSize: 64, fontWeight: 'bold' }}>EXPO</Text>
 *   </Mask.Content>
 * </Mask>
 * ```
 */
export function Mask(props: MaskProps) {
  return <MaskNativeView {...transformProps(props)} />;
}
