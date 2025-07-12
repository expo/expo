import React, { ComponentProps, PropsWithChildren } from 'react';
import { BottomTabsProps } from 'react-native-screens/lib/typescript/components/BottomTabs';
import { Tab } from './TabOptions';
declare function NativeTabsNavigator({ children, ...rest }: PropsWithChildren<BottomTabsProps>): React.JSX.Element;
export declare const createNativeTabNavigator: (config?: any) => any;
export declare const NativeTabs: ((props: ComponentProps<typeof NativeTabsNavigator>) => React.JSX.Element) & {
    Tab: typeof Tab;
};
export {};
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map