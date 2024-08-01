import { Slot } from '@radix-ui/react-slot';
import { ComponentType, ReactNode } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Link, LinkProps } from '../link/Link';
import { ScreenTrigger } from './common';

export type TabTriggerOptions<T extends string | object> = ScreenTrigger<T>;

export type TabTriggerProps<T extends string | object> = LinkProps<T> &
  TabTriggerOptions<T> & {
    children: ReactNode;
  };

export type TabListProps = ViewProps & {
  /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
  asChild?: boolean;
};

export function TabList({ asChild, ...props }: TabListProps) {
  const Element: ComponentType<any> = asChild ? Slot : View;
  return <Element style={styles.tabList} {...props} />;
}

export function TabTrigger<T extends string | object>(props: TabTriggerProps<T>) {
  return (
    <Link style={styles.tabTrigger} {...props}>
      {props.children}
    </Link>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
