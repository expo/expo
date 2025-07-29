import { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import type { ColorValue, TextStyle } from 'react-native';
import type { BottomTabsProps, BottomTabsScreenProps, TabBarItemLabelVisibilityMode } from 'react-native-screens';
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
        iconColor?: ColorValue;
        backgroundColor?: ColorValue;
        blurEffect?: BottomTabsScreenProps['tabBarBlurEffect'];
        tintColor?: ColorValue;
        badgeBackgroundColor?: ColorValue;
        /**
         * @platform android
         */
        rippleColor?: ColorValue;
        /**
         * @platform android
         */
        labelVisibilityMode?: TabBarItemLabelVisibilityMode;
        '&:active'?: {
            /**
             * @platform android
             */
            color?: ColorValue;
            /**
             * @platform android
             */
            fontSize?: TextStyle['fontSize'];
            /**
             * @platform android
             */
            iconColor?: ColorValue;
            /**
             * @platform android
             */
            indicatorColor?: ColorValue;
        };
    };
    /**
     *
     * @platform iOS 26
     */
    minimizeBehavior?: BottomTabsProps['tabBarMinimizeBehavior'];
    /**
     * @platform android
     */
    disableIndicator?: boolean;
    builder: ReturnType<typeof useNavigationBuilder<TabNavigationState<ParamListBase>, TabRouterOptions, Record<string, (...args: any) => void>, NativeTabOptions, Record<string, any>>>;
}
//# sourceMappingURL=types.d.ts.map