import { requireNativeLayoutView } from '../../requireNativeLayoutView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export interface ZStackProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * The alignment of children within the stack.
   */
  alignment?: Alignment;
}

const ZStackNativeView: React.ComponentType<ZStackProps> = requireNativeLayoutView(
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
