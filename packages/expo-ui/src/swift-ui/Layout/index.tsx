import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

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
  const { onPress, modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
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

function transformGroupProps(props: GroupProps): NativeGroupProps {
  const { onPress, modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
  };
}

export function Group(props: GroupProps) {
  return <GroupNativeView {...transformGroupProps(props)} />;
}
//#endregion

//#region ZStack Component
export interface ZStackProps extends StackBaseProps {
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
}

const ZStackNativeView: React.ComponentType<NativeStackProps> = requireNativeView(
  'ExpoUI',
  'ZStackView'
);

export function ZStack(props: ZStackProps) {
  return <ZStackNativeView {...transformNativeProps(props)} />;
}
//#endregion
