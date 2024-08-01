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
  const tabs = useTabsWithChildren({ children, ...options });
  const NavigationContent = tabs.NavigationContent;

  return (
    <TabsContext.Provider value={tabs}>
      <View style={styles.tabsRoot} {...props}>
        <NavigationContent>{children}</NavigationContent>
      </View>
    </TabsContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
});
