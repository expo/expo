import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

type TapEvent = ViewEvent<'onTap', object> & {
  useTapGesture?: boolean;
};

export type VStackProps = {
  /**
   * The horizontal alignment of children within the stack.
   */
  alignment?: 'leading' | 'center' | 'trailing';
  /**
   * The spacing between children.
   */
  spacing?: number;
  /**
   * Callback triggered when the view is pressed.
   */
  onPress?: () => void;
} & CommonViewModifierProps;

type NativeStackProps = Omit<VStackProps, 'onPress'> | TapEvent;

const VStackNativeView: React.ComponentType<NativeStackProps> = requireNativeView(
  'ExpoUI',
  'VStackView'
);

export function VStack(props: VStackProps) {
  const { onPress, modifiers, ...restProps } = props;
  return (
    <VStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      {...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null)}
    />
  );
}
