import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type LazyHStackProps = {
  children: React.ReactNode;
  /**
   * The spacing between children.
   */
  spacing?: number;
  /**
   * The vertical alignment of children within the stack.
   */
  alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
} & CommonViewModifierProps;

const LazyHStackNativeView: React.ComponentType<LazyHStackProps> = requireNativeView(
  'ExpoUI',
  'LazyHStackView'
);

export function LazyHStack(props: LazyHStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <LazyHStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
