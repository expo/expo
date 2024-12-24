import { ComponentProps, ReactElement } from 'react';
import { ScreenContainer } from 'react-native-screens';
import { TabsDescriptor } from './TabContext';
import { TabListProps } from './TabList';
export type TabSlotProps = ComponentProps<typeof ScreenContainer> & {
    /**
     * Remove inactive screens.
     */
    detachInactiveScreens?: boolean;
    /**
     * Override how the `Screen` component is rendered.
     */
    renderFn?: typeof defaultTabsSlotRender;
};
/**
 * Options provided to the `UseTabSlotOptions`.
 */
export type TabsSlotRenderOptions = {
    /**
     * Index of screen.
     */
    index: number;
    /**
     * Whether the screen is focused.
     */
    isFocused: boolean;
    /**
     * Whether the screen has been loaded.
     */
    loaded: boolean;
    /**
     * Should the screen be unloaded when inactive.
     */
    detachInactiveScreens: boolean;
};
/**
 * Returns a `ReactElement` of the current tab.
 *
 * @example
 * ```tsx
 * function MyTabSlot() {
 *   const slot = useTabSlot();
 *
 *   return slot;
 * }
 * ```
 */
export declare function useTabSlot({ detachInactiveScreens, style, renderFn, }?: TabSlotProps): import("react").JSX.Element;
/**
 * Renders the current tab.
 *
 * @see [`useTabSlot`](#usetabslot) for a hook version of this component.
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
export declare function TabSlot(props: TabSlotProps): import("react").JSX.Element;
/**
 * @hidden
 */
export declare function defaultTabsSlotRender(descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions): import("react").JSX.Element | null;
/**
 * @hidden
 */
export declare function isTabSlot(child: ReactElement<any>): child is ReactElement<TabListProps>;
//# sourceMappingURL=TabSlot.d.ts.map