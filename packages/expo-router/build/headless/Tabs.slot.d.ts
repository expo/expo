/// <reference types="react" />
import { ViewProps } from 'react-native';
import { TabsDescriptor } from './Tabs.common';
export type UseTabsSlotOptions = {
    detachInactiveScreens?: boolean;
    renderFn?: typeof defaultTabsSlotRender;
};
export type TabsSlotRenderOptions = {
    index: number;
    isFocused: boolean;
    loaded: boolean;
};
export declare function useTabSlot({ detachInactiveScreens, renderFn, }?: UseTabsSlotOptions): import("react").JSX.Element;
export declare function TabSlot(props: ViewProps): import("react").JSX.Element;
export declare function defaultTabsSlotRender(descriptor: TabsDescriptor, { isFocused, loaded }: TabsSlotRenderOptions): import("react").JSX.Element;
//# sourceMappingURL=Tabs.slot.d.ts.map