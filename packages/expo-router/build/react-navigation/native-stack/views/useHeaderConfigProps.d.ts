import { type ScreenStackHeaderConfigProps } from 'react-native-screens';
import { type Route } from '../../native';
import type { NativeStackNavigationOptions } from '../types';
type Props = NativeStackNavigationOptions & {
    headerTopInsetEnabled: boolean;
    headerHeight: number;
    headerBack: {
        title?: string | undefined;
        href: undefined;
    } | undefined;
    route: Route<string>;
};
export declare function useHeaderConfigProps({ headerBackIcon, headerBackImageSource, headerBackButtonDisplayMode, headerBackButtonMenuEnabled, headerBackTitle, headerBackTitleStyle, headerBackVisible, headerShadowVisible, headerLargeStyle, headerLargeTitle: headerLargeTitleDeprecated, headerLargeTitleEnabled, headerLargeTitleShadowVisible, headerLargeTitleStyle, headerBackground, headerLeft, headerRight, headerShown, headerStyle, headerBlurEffect, headerTintColor, headerTitle, headerTitleAlign, headerTitleStyle, headerTransparent, headerSearchBarOptions, headerTopInsetEnabled, headerBack, route, title, unstable_headerLeftItems: headerLeftItems, unstable_headerRightItems: headerRightItems, }: Props): ScreenStackHeaderConfigProps;
export {};
//# sourceMappingURL=useHeaderConfigProps.d.ts.map