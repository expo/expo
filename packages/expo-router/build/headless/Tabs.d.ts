import { PropsWithChildren, ReactNode } from 'react';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { BottomTabNavigationConfig } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { DefaultNavigatorOptions, ParamListBase, TabActionHelpers, TabNavigationState, TabRouterOptions } from '@react-navigation/native';
import { Href } from '../types';
export * from './Tabs.slot';
export * from './Tabs.common';
export type UseTabsOptions = Omit<DefaultNavigatorOptions<ParamListBase, TabNavigationState<ParamListBase>, TabsScreenOptions, TabNavigationEventMap>, 'children'> & Omit<TabRouterOptions, 'initialRouteName'> & // Should be set through `unstable_settings`
BottomTabNavigationConfig & {
    hrefs: HrefOptions;
};
export type TabsProps = PropsWithChildren<UseTabsOptions>;
export type TabsScreenOptions = BottomTabNavigationOptions;
export type TabNavigationEventMap = {
    /**
     * Event which fires on tapping on the tab in the tab bar.
     */
    tabPress: {
        data: undefined;
        canPreventDefault: true;
    };
    /**
     * Event which fires on long press on the tab in the tab bar.
     */
    tabLongPress: {
        data: undefined;
    };
};
export declare function useTabs({ hrefs, ...options }: UseTabsOptions): {
    state: TabNavigationState<ParamListBase>;
    navigation: {
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName] | [screen: RouteName, params: object | undefined] : never): void;
        navigate<RouteName_1 extends string>(options: RouteName_1 extends unknown ? {
            key: string;
            params?: object | undefined;
            merge?: boolean | undefined;
        } | {
            name: RouteName_1;
            key?: string | undefined;
            params: object | undefined;
            merge?: boolean | undefined;
        } : never): void;
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }> | import("@react-navigation/core").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/core").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>;
    } & import("@react-navigation/core").PrivateValueStore<[ParamListBase, unknown, unknown]> & import("@react-navigation/core").EventEmitter<TabNavigationEventMap> & {
        setParams<RouteName_2 extends string>(params: Partial<object | undefined>): void;
    } & TabActionHelpers<ParamListBase>;
    descriptors: Record<string, import("@react-navigation/core").Descriptor<BottomTabNavigationOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: TabNavigationState<ParamListBase>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName_3 extends string>(...args: RouteName_3 extends unknown ? [screen: RouteName_3] | [screen: RouteName_3, params: object | undefined] : never): void;
        navigate<RouteName_1_1 extends string>(options: RouteName_1_1 extends unknown ? {
            key: string;
            params?: object | undefined;
            merge?: boolean | undefined;
        } | {
            name: RouteName_1_1;
            key?: string | undefined;
            params: object | undefined;
            merge?: boolean | undefined;
        } : never): void;
        reset(state: TabNavigationState<ParamListBase> | import("@react-navigation/core").PartialState<TabNavigationState<ParamListBase>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T_1 = import("@react-navigation/core").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T_1;
        getState(): TabNavigationState<ParamListBase>;
    } & import("@react-navigation/core").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T_1 = import("@react-navigation/core").NavigationProp<ParamListBase, string, undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T_1;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<BottomTabNavigationOptions>): void;
    } & import("@react-navigation/core").EventConsumer<TabNavigationEventMap & import("@react-navigation/core").EventMapCore<TabNavigationState<ParamListBase>>> & import("@react-navigation/core").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/core").RouteProp<ParamListBase, string>>>;
    NavigationContent: ({ children }: {
        children: ReactNode;
    }) => JSX.Element;
};
export declare function Tabs({ children, ...options }: TabsProps): import("react").JSX.Element;
type HrefOptions = Record<string, object> | Array<Href | [Href, object]>;
//# sourceMappingURL=Tabs.d.ts.map