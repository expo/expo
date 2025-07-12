import { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import React from 'react';
import { BottomTabsProps } from 'react-native-screens/lib/typescript/components/BottomTabs';
import type { BottomTabsScreenProps } from 'react-native-screens/lib/typescript/components/BottomTabsScreen';
export interface NativeTabOptions extends DefaultRouterOptions {
    tabBarBackgroundColor?: BottomTabsScreenProps['tabBarBackgroundColor'];
    tabBarBlurEffect?: BottomTabsScreenProps['tabBarBlurEffect'];
    tabBarItemTitleFontFamily?: BottomTabsScreenProps['tabBarItemTitleFontFamily'];
    tabBarItemTitleFontSize?: BottomTabsScreenProps['tabBarItemTitleFontSize'];
    tabBarItemTitleFontWeight?: BottomTabsScreenProps['tabBarItemTitleFontWeight'];
    tabBarItemTitleFontStyle?: BottomTabsScreenProps['tabBarItemTitleFontStyle'];
    tabBarItemTitleFontColor?: BottomTabsScreenProps['tabBarItemTitleFontColor'];
    tabBarItemTitlePositionAdjustment?: BottomTabsScreenProps['tabBarItemTitlePositionAdjustment'];
    tabBarItemIconColor?: BottomTabsScreenProps['tabBarItemIconColor'];
    tabBarItemBadgeBackgroundColor?: BottomTabsScreenProps['tabBarItemBadgeBackgroundColor'];
    title?: BottomTabsScreenProps['title'];
    iconSFSymbolName?: BottomTabsScreenProps['iconSFSymbolName'];
    selectedIconSFSymbolName?: BottomTabsScreenProps['selectedIconSFSymbolName'];
    badgeValue?: BottomTabsScreenProps['badgeValue'];
}
export type NativeTabsViewProps = Omit<BottomTabsProps, 'onNativeFocusChange'> & {
    builder: ReturnType<typeof useNavigationBuilder<TabNavigationState<ParamListBase>, TabRouterOptions, Record<string, (...args: any) => void>, NativeTabOptions, Record<string, any>>>;
};
export declare function NativeTabsView(props: NativeTabsViewProps): React.JSX.Element;
//# sourceMappingURL=NativeTabsView.d.ts.map