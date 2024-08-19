/// <reference types="react" />
import { ViewProps } from 'react-native';
import { TabsDescriptor } from './Tab-shared';
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
//# sourceMappingURL=TabSlot.d.ts.map