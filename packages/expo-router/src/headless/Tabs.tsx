import { useMemo } from 'react';
import { StyleSheet, ViewProps, View } from 'react-native';
import { TabsContext } from './Tabs.common';
import { UseTabsOptions, useTabsWithChildren } from './Tabs.hooks';

export * from './Tabs.common';
export * from './Tabs.hooks';
export * from './Tabs.list';
export * from './Tabs.slot';

export type TabsProps = ViewProps & {
  options?: UseTabsOptions;
};

export function Tabs({ children, options, ...props }: TabsProps) {
  const { NavigationContent, state, descriptors, navigation } = useTabsWithChildren({
    children,
    ...options,
  });

  const a = useMemo(() => {
    return { state, descriptors, NavigationContent, navigation };
  }, [state, descriptors, NavigationContent, navigation]);

  return (
    <View style={styles.tabsRoot} {...props}>
      <TabsContext.Provider value={a}>
        <NavigationContent>{children}</NavigationContent>
      </TabsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
});
