import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { CommonViewModifierProps } from '../types';

export type ZStackProps = {
  children: React.ReactNode;
  /**
   * The alignment of children within the stack.
   */
  alignment?:
    | 'center'
    | 'leading'
    | 'trailing'
    | 'top'
    | 'bottom'
    | 'topLeading'
    | 'topTrailing'
    | 'bottomLeading'
    | 'bottomTrailing'
    | 'centerFirstTextBaseline'
    | 'centerLastTextBaseline'
    | 'leadingFirstTextBaseline'
    | 'leadingLastTextBaseline'
    | 'trailingFirstTextBaseline'
    | 'trailingLastTextBaseline';
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
