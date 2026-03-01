import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type VStackProps = {
  children: React.ReactNode;
  /**
   * The horizontal alignment of children within the stack.
   */
  alignment?: 'leading' | 'center' | 'trailing';
  /**
   * The spacing between children.
   */
  spacing?: number;
} & CommonViewModifierProps;

const VStackNativeView: React.ComponentType<VStackProps> = requireNativeView(
  'ExpoUI',
  'VStackView'
);

export function VStack(props: VStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <VStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
