import { ComponentType, ReactNode } from 'react';
import { View, Pressable, StyleSheet, ViewProps, PressableProps } from 'react-native';
import { Href } from '../types';

export type TabTriggerOptions = {
  href: Href;
  initialRoute?: boolean;
};

export type TabTriggerProps<T extends typeof Pressable = typeof Pressable> = PressableProps &
  TabTriggerOptions & {
    as?: T;
    children: ReactNode;
  };

export type TabListProps = ViewProps & {
  as?: typeof View | ComponentType<ViewProps>;
};

export function TabList({ as: As = View, ...props }: TabListProps) {
  return <As style={styles.tabList} {...props} />;
}

export function TabTrigger({ as: As = Pressable, style, ...props }: TabTriggerProps) {
  return (
    <As style={styles.tabTrigger} {...props}>
      {props.children}
    </As>
  );
}

const styles = StyleSheet.create({
  tabList: { flexDirection: 'row', justifyContent: 'space-between' },
  tabTrigger: { flexDirection: 'row', justifyContent: 'space-between' },
});
