import { ComponentProps, ReactElement } from 'react';
import { ScreenContainer } from 'react-native-screens';
import { TabsDescriptor } from './TabContext';
import { TabListProps } from './TabList';
export type UseTabSlotOptions = ComponentProps<typeof ScreenContainer> & {
    detachInactiveScreens?: boolean;
    renderFn?: typeof defaultTabsSlotRender;
};
export type TabsSlotRenderOptions = {
    index: number;
    isFocused: boolean;
    loaded: boolean;
    detachInactiveScreens: boolean;
};
export declare function useTabSlot({ detachInactiveScreens, style, renderFn, }?: UseTabSlotOptions): import("react").JSX.Element;
export type TabSlotProps = UseTabSlotOptions;
export declare function TabSlot(props: TabSlotProps): import("react").JSX.Element;
export declare function useTab(): {
    options: import("@react-navigation/bottom-tabs").BottomTabNavigationOptions;
    setOptions: (options: Partial<{}>) => void;
};
export declare function defaultTabsSlotRender(descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions): import("react").JSX.Element | null;
export declare function isTabSlot(child: ReactElement<any>): child is ReactElement<TabListProps>;
//# sourceMappingURL=TabSlot.d.ts.map