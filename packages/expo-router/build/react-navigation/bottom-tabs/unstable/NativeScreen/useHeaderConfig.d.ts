import { type ScreenStackHeaderConfigProps } from 'react-native-screens';
import type { NativeHeaderOptions } from './types';
import { type Route } from '../../../native';
type Props = NativeHeaderOptions & {
    headerTopInsetEnabled: boolean;
    headerHeight: number;
    route: Route<string>;
};
export declare function useHeaderConfig({ headerShadowVisible, headerLargeStyle, headerLargeTitleEnabled, headerLargeTitleShadowVisible, headerLargeTitleStyle, headerBackground, headerLeft, headerRight, headerShown, headerStyle, headerBlurEffect, headerTintColor, headerTitle, headerTitleAlign, headerTitleStyle, headerTransparent, headerSearchBarOptions, headerTopInsetEnabled, route, title, unstable_headerLeftItems: headerLeftItems, unstable_headerRightItems: headerRightItems, }: Props): ScreenStackHeaderConfigProps;
export {};
//# sourceMappingURL=useHeaderConfig.d.ts.map