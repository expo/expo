import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type HStackProps = {
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
   * Marks this stack as a scroll target layout for `scrollPosition` tracking.
   * @platform ios 17.0+
   */
  scrollTargetLayout?: boolean;
} & CommonViewModifierProps;

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
