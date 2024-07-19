import { ComponentType, PropsWithChildren } from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { Href } from '../types';
import { PressableProps } from '../views/Pressable';

export type TabTriggerOptions = {
  href: Href;
  initialRoute?: boolean;
};

export type TabTriggerProps = PropsWithChildren<
  TabTriggerOptions & {
    as?: typeof Pressable | ComponentType<PressableProps>;
  }
>;

export type TabListProps = PropsWithChildren<
  ViewProps & {
    as?: typeof View | ComponentType<ViewProps>;
  }
>;

export function TabList({
  as: As = View,
  style = { flexDirection: 'row', justifyContent: 'space-between' },
  ...props
}: TabListProps) {
  return <As {...props} style={style} />;
}

export function TabTrigger({ as: As = Pressable, ...props }: TabTriggerProps) {
  return <As {...props}>{props.children}</As>;
}
