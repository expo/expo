import { ReactElement, ComponentProps } from 'react';
import { ViewProps } from 'react-native';
export type TabListProps = ViewProps & {
    /** Forward props to child component and removes the extra `<View>`. Useful for custom wrappers. */
    asChild?: boolean;
};
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
export declare function TabList({ asChild, style, ...props }: TabListProps): import("react").JSX.Element;
/**
 * @hidden
 */
export declare function isTabList(child: ReactElement<any>): child is ReactElement<ComponentProps<typeof TabList>>;
//# sourceMappingURL=TabList.d.ts.map