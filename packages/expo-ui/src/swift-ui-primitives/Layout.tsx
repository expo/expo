import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from './types';
import { ViewEvent } from '../types';

type TapEvent = ViewEvent<'onTap', object> & {
  useTapGesture?: boolean;
};

interface StackBaseProps extends CommonViewModifierProps {
  children: React.ReactNode;
  spacing?: number;
  backgroundColor?: string;

  /**
   * Callback triggered when the view is pressed.
   */
  onPress?: () => void;
}
export type NativeStackProps = Omit<StackBaseProps, 'onPress'> | TapEvent;

function transformNativeProps(props: StackBaseProps): NativeStackProps {
  const { onPress, ...restProps } = props;
  return {
    ...restProps,
    ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
  };
}

//#region HStack Component
export interface HStackProps extends StackBaseProps {
  alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
}

const HStackNativeView: React.ComponentType<NativeStackProps> = requireNativeView(
  'ExpoUI',
  'HStackView'
);

export function HStack(props: HStackProps) {
  return <HStackNativeView {...transformNativeProps(props)} />;
}
//#endregion

//#region VStack Component
export interface VStackProps extends StackBaseProps {
  alignment?: 'leading' | 'center' | 'trailing';
}

const VStackNativeView: React.ComponentType<NativeStackProps> = requireNativeView(
  'ExpoUI',
  'VStackView'
);

export function VStack(props: VStackProps) {
  return <VStackNativeView {...transformNativeProps(props)} />;
}
//#endregion

//#region Group Component
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
  return <GroupNativeView {...transformNativeProps(props)} />;
}
//#endregion
