/// <reference types="react" />
import { ViewProps } from 'react-native';
import { Route, TabsDescriptor } from './Tabs.common';
export type UseTabsSlotOptions = {
    detachInactiveScreens?: boolean;
    renderFn?: typeof defaultTabsSlotRender;
};
export type TabsSlotRenderOptions = {
    index: number;
    isFocused: boolean;
    loaded: boolean;
    detachInactiveScreens: boolean;
};
export declare function useTabSlot({ detachInactiveScreens, renderFn, }?: UseTabsSlotOptions): import("react").JSX.Element;
export declare function TabSlot(props: ViewProps): import("react").JSX.Element;
export declare function defaultTabsSlotRender(route: Route, descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions): import("react").JSX.Element | null;
//# sourceMappingURL=Tabs.slot.d.ts.map