import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

type TapEvent = ViewEvent<'onTap', object> & {
  useTapGesture?: boolean;
};

export interface GroupProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * Callback triggered when the view is pressed.
   */
  onPress?: () => void;
}

type NativeGroupProps = Omit<GroupProps, 'onPress'> | TapEvent;

const GroupNativeView: React.ComponentType<NativeGroupProps> = requireNativeView(
  'ExpoUI',
  'GroupView'
);

export function Group(props: GroupProps) {
  const { onPress, modifiers, ...restProps } = props;
  return (
    <GroupNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      {...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null)}
    />
  );
}
