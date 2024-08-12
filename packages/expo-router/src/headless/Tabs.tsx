import { useMemo } from 'react';
import { StyleSheet, ViewProps, View } from 'react-native';
import { UseTabsOptions, useTabsWithChildren } from './Tabs.hooks';

export * from './Tabs.common';
export * from './Tabs.hooks';
export * from './Tabs.list';
export * from './Tabs.slot';

export type TabsProps = ViewProps & {
  options?: UseTabsOptions;
};

export function Tabs({ children, options, ...props }: TabsProps) {
  const { NavigationContent } = useTabsWithChildren({
    children,
    ...options,
  });

  return (
    <View style={styles.tabsRoot} {...props}>
      <NavigationContent>{children}</NavigationContent>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
});
