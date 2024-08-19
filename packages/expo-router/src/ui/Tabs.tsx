import { isValidElement } from 'react';
import { StyleSheet, ViewProps, View } from 'react-native';

import { UseTabsOptions, useTabsWithChildren } from './Tab-hooks';
import { ViewSlot } from './common';

export * from './Tab-shared';
export * from './Tab-hooks';
export * from './TabList';
export * from './TabSlot';

export type TabsProps = ViewProps & {
  asChild?: boolean;
  options?: UseTabsOptions;
};

export function Tabs({ children, asChild, options, ...props }: TabsProps) {
  const Comp = asChild ? ViewSlot : View;

  const { NavigationContent } = useTabsWithChildren({
    // asChild adds an extra layer, so we need to process the child's children
    children: asChild && isValidElement(children) ? children.props.children : children,
    ...options,
  });

  return (
    <Comp style={styles.tabsRoot} {...props}>
      <NavigationContent>{children}</NavigationContent>
    </Comp>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
});
