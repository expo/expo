import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export type ZStackProps = {
  children: React.ReactNode;
  /**
   * The alignment of children within the stack.
   */
  alignment?: Alignment;
} & CommonViewModifierProps;

const ZStackNativeView: React.ComponentType<ZStackProps> = requireNativeView(
  'ExpoUI',
  'ZStackView'
);

export function ZStack(props: ZStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <ZStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
