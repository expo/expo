import React from 'react';
import type { TabsHostProps } from 'react-native-screens';
import type { NativeTabOptions, NativeTabsViewProps } from './types';
export declare function useSelectedScreenKey({ focusedIndex, provenance, tabs, }: Pick<NativeTabsViewProps, 'focusedIndex' | 'provenance' | 'tabs'>): {
    selectedScreenKey: string;
    provenance: number;
};
export declare function useOnTabSelectedHandler(onTabChange: NativeTabsViewProps['onTabChange']): NonNullable<TabsHostProps['onTabSelected']>;
/**
 * Cross-platform fields used to render a single tab screen. Each platform
 * extends this with its own appearance fields.
 */
export interface InternalTabScreenProps {
    routeKey: string;
    name: string;
    isFocused: boolean;
    options: NativeTabOptions;
    contentRenderer: () => React.ReactNode;
}
export declare function useSharedScreenProps(props: InternalTabScreenProps): {
    options: NativeTabOptions;
    pointerEvents: "box-none" | "none";
    title: string;
    nativeIosOverrides: import("react-native-screens").TabsScreenPropsIOS | undefined;
    nativeAndroidOverrides: import("react-native-screens").TabsScreenPropsAndroid | undefined;
    nativeRestOverrides: {
        children?: React.ReactNode;
        style?: import("react-native").StyleProp<Pick<import("react-native").ViewStyle, "backgroundColor">>;
        title?: string | undefined | undefined;
        testID?: string | undefined | undefined;
        accessibilityLabel?: string | undefined | undefined;
        onWillAppear?: import("react-native-screens").TabsScreenEventHandler<import("react-native-screens/lib/typescript/components/tabs/screen").EmptyObject> | undefined;
        onWillDisappear?: import("react-native-screens").TabsScreenEventHandler<import("react-native-screens/lib/typescript/components/tabs/screen").EmptyObject> | undefined;
        orientation?: import("react-native-screens").TabsScreenOrientation | undefined;
        onDidAppear?: import("react-native-screens").TabsScreenEventHandler<import("react-native-screens/lib/typescript/components/tabs/screen").EmptyObject> | undefined;
        onDidDisappear?: import("react-native-screens").TabsScreenEventHandler<import("react-native-screens/lib/typescript/components/tabs/screen").EmptyObject> | undefined;
        preventNativeSelection?: boolean | undefined | undefined;
        badgeValue?: string | undefined | undefined;
        specialEffects?: {
            repeatedTabSelection?: {
                popToRoot?: boolean | undefined;
                scrollToTop?: boolean | undefined;
            } | undefined;
        } | undefined | undefined;
        tabBarItemTestID?: string | undefined | undefined;
        tabBarItemAccessibilityLabel?: string | undefined | undefined;
    };
    screenKey: string;
    icon: {
        sf?: import("sf-symbols-typescript").SFSymbol;
        xcasset?: string;
        drawable?: string;
    } | {
        src?: import("react-native").ImageSourcePropType;
        renderingMode?: "template" | "original";
    } | undefined;
    selectedIcon: {
        sf?: import("sf-symbols-typescript").SFSymbol;
        xcasset?: string;
        drawable?: string;
    } | {
        src?: import("react-native").ImageSourcePropType;
        renderingMode?: "template" | "original";
    } | undefined;
};
export declare function ScreenContent({ options, contentRenderer, }: {
    options: NativeTabOptions;
    contentRenderer: () => React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=NativeTabsView.shared.d.ts.map