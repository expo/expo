import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

type TapEvent = ViewEvent<'onTap', object> & {
  useTapGesture?: boolean;
};

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
   * Callback triggered when the view is pressed.
   */
  onPress?: () => void;
} & CommonViewModifierProps;

type NativeStackProps = Omit<HStackProps, 'onPress'> | TapEvent;

const HStackNativeView: React.ComponentType<NativeStackProps> = requireNativeView(
  'ExpoUI',
  'HStackView'
);

export function HStack(props: HStackProps) {
  const { onPress, modifiers, ...restProps } = props;
  return (
    <HStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      {...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null)}
    />
  );
}
