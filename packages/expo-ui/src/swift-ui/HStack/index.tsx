import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface HStackProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * The spacing between children.
   */
  spacing?: number;
  /**
   * The vertical alignment of children within the stack.
   */
  alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
  /**
   * When `true`, a child percentage is a fraction of this stack.
   * Universal `Row` sets this. Leave it unset to keep the SwiftUI `HStack`.
   * @hidden
   */
  resolvesChildPercentages?: boolean;
  /**
   * When `true` with `resolvesChildPercentages`, this stack uses the percentage layout.
   * Universal `Row` sets this only when it or a child has a percentage size.
   * @hidden
   */
  usesPercentageLayout?: boolean;
}

const HStackNativeView: React.ComponentType<HStackProps> = requireNativeView(
  'ExpoUI',
  'HStackView'
);

export function HStack(props: HStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <HStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
