import type { NavigationContainerRef } from '@react-navigation/native';
import { type ComponentProps, type Ref } from 'react';
declare const NavigationContainer: (<RootParamList extends {} = ReactNavigation.RootParamList>(props: (import("@react-navigation/native").NavigationContainerProps & {
    initialState?: Readonly<Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "routes" | "stale">> & {
        routes: (Omit<import("@react-navigation/native").Route<string>, "key"> & {
            state?: import("@react-navigation/native").InitialState;
        })[];
    }> | undefined;
    direction?: import("@react-navigation/native").LocaleDirection;
    linking?: import("@react-navigation/native").LinkingOptions<RootParamList> | undefined;
    fallback?: React.ReactNode;
    documentTitle?: import("@react-navigation/native").DocumentTitleOptions;
}) & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
}) => React.ReactElement) | undefined;
type NavigationContainerProps = ComponentProps<NonNullable<typeof NavigationContainer>>;
export type ObserveNavigationContainerProps = NavigationContainerProps;
export declare const ObserveNavigationContainer: import("react").ForwardRefExoticComponent<Omit<import("@react-navigation/native").NavigationContainerProps & {
    initialState?: Readonly<Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "routes" | "stale">> & {
        routes: (Omit<import("@react-navigation/native").Route<string>, "key"> & {
            state?: import("@react-navigation/native").InitialState;
        })[];
    }> | undefined;
    direction?: import("@react-navigation/native").LocaleDirection;
    linking?: import("@react-navigation/native").LinkingOptions<{}> | undefined;
    fallback?: React.ReactNode;
    documentTitle?: import("@react-navigation/native").DocumentTitleOptions;
} & {
    ref?: Ref<NavigationContainerRef<{}>> | undefined;
}, "ref"> & import("react").RefAttributes<NavigationContainerRef<ReactNavigation.RootParamList>>>;
export {};
//# sourceMappingURL=ObserveNavigationContainer.d.ts.map