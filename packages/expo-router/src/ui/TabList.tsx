import { ReactElement, ComponentProps } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

import { ViewSlot } from './common';

export type TabListProps = ViewProps & {
  /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
  asChild?: boolean;
};

export function TabList({ asChild, style, ...props }: TabListProps) {
  const Comp = asChild ? ViewSlot : View;
  return <Comp style={[styles.tabList, style]} {...props} />;
}

export function isTabList(
  child: ReactElement<any>
): child is ReactElement<ComponentProps<typeof TabList>> {
  return child.type === TabList;
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
