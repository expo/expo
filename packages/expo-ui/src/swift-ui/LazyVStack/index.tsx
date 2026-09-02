import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface LazyVStackProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * The horizontal alignment of children within the stack.
   */
  alignment?: 'leading' | 'center' | 'trailing';
  /**
   * The spacing between children.
   */
  spacing?: number;
}

const LazyVStackNativeView: React.ComponentType<LazyVStackProps> = requireNativeView(
  'ExpoUI',
  'LazyVStackView'
);

export function LazyVStack(props: LazyVStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <LazyVStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
