import type { ReactElement, ComponentProps } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ViewSlot } from './common';

export type TabListProps = ViewProps & {
  /** Forward props to child component and removes the extra `<View>`. Useful for custom wrappers. */
  asChild?: boolean;
};

/**
 * Wrapper component for `TabTriggers`. `TabTriggers` within the `TabList` define the tabs.
 *
 * The list pads its content by the left and right safe area insets it overlaps, such as the
 * camera rail on iPhone Duo, in addition to its own padding. With `asChild`, the child
 * component is responsible for the safe area.
 *
 * @example
 * ```tsx
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
export function TabList({ asChild, style, ...props }: TabListProps) {
  if (asChild) {
    return <ViewSlot style={[styles.tabList, style]} {...props} />;
  }
  return <SafeAreaView edges={horizontalEdges} style={[styles.tabList, style]} {...props} />;
}

/**
 * @hidden
 */
export function isTabList(
  child: ReactElement<any>
): child is ReactElement<ComponentProps<typeof TabList>> {
  return child.type === TabList;
}

const horizontalEdges = { left: 'additive', right: 'additive' } as const;

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
