import { ReactElement } from 'react';
import { ViewProps } from 'react-native';
import { TabsDescriptor } from './TabContext';
import { TabListProps } from './TabList';
export type UseTabSlotOptions = {
    detachInactiveScreens?: boolean;
    renderFn?: typeof defaultTabsSlotRender;
};
export type TabsSlotRenderOptions = {
    index: number;
    isFocused: boolean;
    loaded: boolean;
};
export declare function useTabSlot({ detachInactiveScreens, renderFn, }?: UseTabSlotOptions): import("react").JSX.Element;
export type TabSlotProps = ViewProps & {
    asChild?: boolean;
    options?: UseTabSlotOptions;
};
export declare function TabSlot({ options, asChild, ...props }: TabSlotProps): import("react").JSX.Element;
export declare function defaultTabsSlotRender(descriptor: TabsDescriptor, { isFocused, loaded }: TabsSlotRenderOptions): import("react").JSX.Element | null;
export declare function isTabSlot(child: ReactElement<any>): child is ReactElement<TabListProps>;
//# sourceMappingURL=TabSlot.d.ts.map