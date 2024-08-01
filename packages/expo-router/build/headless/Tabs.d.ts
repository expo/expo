import { ReactNode } from 'react';
import { ViewProps } from 'react-native';
import { DefaultNavigatorOptions, ParamListBase, TabActionHelpers, TabRouterOptions } from '@react-navigation/native';
import { ExpoTabsScreenOptions } from './Tabs.common';
import { Href } from '../types';
import { ExpoTabNavigationState } from './Tabs.router';
import { TabTriggerOptions } from './Tabs.bar';
export * from './Tabs.slot';
export * from './Tabs.bar';
export * from './Tabs.common';
export type UseTabsOptions = Omit<DefaultNavigatorOptions<ParamListBase, ExpoTabNavigationState, ExpoTabsScreenOptions, TabNavigationEventMap>, 'children'> & Omit<TabRouterOptions, 'initialRouteName'> & {
    triggers: TabTriggerOptions[];
};
export type TabsProps = ViewProps;
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
export declare function useTabs({ triggers, ...options }: UseTabsOptions): {
    NavigationContent: ({ children }: {
        children: ReactNode;
    }) => JSX.Element;
    state: ExpoTabNavigationState;
    descriptors: Record<string, import("@react-navigation/core").Descriptor<ExpoTabsScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: ExpoTabNavigationState) => Readonly<{
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
        reset(state: ExpoTabNavigationState | import("@react-navigation/core").PartialState<ExpoTabNavigationState>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/core").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T;
        getState(): ExpoTabNavigationState;
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
        setOptions(options: Partial<ExpoTabsScreenOptions>): void;
    } & import("@react-navigation/core").EventConsumer<TabNavigationEventMap & import("@react-navigation/core").EventMapCore<ExpoTabNavigationState>> & import("@react-navigation/core").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/core").RouteProp<ParamListBase, string>>>;
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
        navigate<RouteName_2 extends string>(...args: RouteName_2 extends unknown ? [screen: RouteName_2] | [screen: RouteName_2, params: object | undefined] : never): void;
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
        getParent<T_2 = import("@react-navigation/core").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T_2;
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
    routes: {
        [k: string]: {
            route: Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<{
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
                    }> & any)[];
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
                    }> & any)[];
                    type: string;
                    stale: false;
                }>> | undefined;
            };
            action: {
                target: string;
                type: string;
                payload?: object | undefined;
                source?: string | undefined;
            };
            key: string;
            isFocused: boolean;
            props: {
                key: string;
                onPress: () => void;
            };
        };
    };
};
export type ExpoTabHrefs = Record<string, Omit<ExpoTabsScreenOptions, 'action'>> | Array<Href | [Href, Omit<ExpoTabsScreenOptions, 'action'>]>;
export declare function Tabs({ children, ...props }: TabsProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map