import { View, StyleSheet } from 'react-native';
import { ViewSlot } from './common';
/**
 * Wrapper component for `TabTriggers`. `TabTriggers` within the `TabList` define the tabs.
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
export function TabList({ asChild, style, ...props }) {
    const Comp = asChild ? ViewSlot : View;
    return <Comp style={[styles.tabList, style]} {...props}/>;
}
/**
 * @hidden
 */
export function isTabList(child) {
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
//# sourceMappingURL=TabList.js.map