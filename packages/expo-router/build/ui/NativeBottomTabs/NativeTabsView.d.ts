import { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import React from 'react';
import { type ColorValue, type TextStyle } from 'react-native';
import { type BottomTabsScreenProps } from 'react-native-screens';
export type NativeTabOptions = Omit<BottomTabsScreenProps, 'children' | 'placeholder' | 'onWillAppear' | 'onDidAppear' | 'onWillDisappear' | 'onDidDisappear' | 'isFocused' | 'tabKey'> & DefaultRouterOptions & {
    hidden?: boolean;
};
export interface NativeTabsViewProps {
    style?: {
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: TextStyle['fontWeight'];
        fontStyle?: TextStyle['fontStyle'];
        color?: TextStyle['color'];
        backgroundColor?: ColorValue;
        blurEffect?: BottomTabsScreenProps['tabBarBlurEffect'];
        tintColor?: ColorValue;
        badgeBackgroundColor?: ColorValue;
    };
    builder: ReturnType<typeof useNavigationBuilder<TabNavigationState<ParamListBase>, TabRouterOptions, Record<string, (...args: any) => void>, NativeTabOptions, Record<string, any>>>;
}
export declare function NativeTabsView(props: NativeTabsViewProps): React.JSX.Element;
//# sourceMappingURL=NativeTabsView.d.ts.map