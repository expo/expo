import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { CommonViewModifierProps } from '../types';

type TapEvent = ViewEvent<'onTap', object> & {
  useTapGesture?: boolean;
};

export type ZStackProps = {
  children: React.ReactNode;
  /**
   * Callback triggered when the view is pressed.
   */
  onPress?: () => void;
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

type NativeStackProps = Omit<ZStackProps, 'onPress'> | TapEvent;

const ZStackNativeView: React.ComponentType<NativeStackProps> = requireNativeView(
  'ExpoUI',
  'ZStackView'
);

export function ZStack(props: ZStackProps) {
  const { onPress, modifiers, ...restProps } = props;
  return (
    <ZStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      {...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null)}
    />
  );
}
