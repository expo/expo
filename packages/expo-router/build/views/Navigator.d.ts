import { RouterFactory, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
type NavigatorTypes = ReturnType<typeof useNavigationBuilder>;
export declare const NavigatorContext: React.Context<{
    contextKey: string;
    state: NavigatorTypes['state'];
    navigation: NavigatorTypes['navigation'];
    descriptors: NavigatorTypes['descriptors'];
    router: RouterFactory<any, any, any>;
} | null>;
export type NavigatorProps = {
    initialRouteName?: Parameters<typeof useNavigationBuilder>[1]['initialRouteName'];
    screenOptions?: Parameters<typeof useNavigationBuilder>[1]['screenOptions'];
    children?: Parameters<typeof useNavigationBuilder>[1]['children'];
    router?: Parameters<typeof useNavigationBuilder>[0];
};
/** An unstyled custom navigator. Good for basic web layouts */
export declare function Navigator({ initialRouteName, screenOptions, children, router }: NavigatorProps): React.JSX.Element | null;
export declare namespace Navigator {
    var Slot: typeof import("./Navigator").Slot;
    var useContext: typeof useNavigatorContext;
    var Screen: typeof import("./Screen").Screen;
}
export declare function useNavigatorContext(): {
    contextKey: string;
    state: Readonly<{
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
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>;
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/native").NavigationHelpers<import("@react-navigation/native").ParamListBase, {}> | undefined>(id?: string | undefined): T;
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>;
    } & import("@react-navigation/native").PrivateValueStore<[import("@react-navigation/native").ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<Record<string, any>> & {
        setParams<RouteName_2 extends string>(params: Partial<object | undefined>): void;
    } & Record<string, () => void>;
    descriptors: Record<string, import("@react-navigation/native").Descriptor<{}, Omit<{
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>) => Readonly<{
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T_1 = import("@react-navigation/native").NavigationHelpers<import("@react-navigation/native").ParamListBase, {}> | undefined>(id?: string | undefined): T_1;
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>;
    } & import("@react-navigation/native").PrivateValueStore<[import("@react-navigation/native").ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T_1 = import("@react-navigation/native").NavigationProp<import("@react-navigation/native").ParamListBase, string, undefined, Readonly<{
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
                state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T_1;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<{}>): void;
    } & import("@react-navigation/native").EventConsumer<Record<string, any> & import("@react-navigation/native").EventMapCore<Readonly<{
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
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>>> & import("@react-navigation/native").PrivateValueStore<[import("@react-navigation/native").ParamListBase, string, Record<string, any>]> & Record<string, () => void>, import("@react-navigation/native").RouteProp<import("@react-navigation/native").ParamListBase, string>>>;
    router: RouterFactory<any, any, any>;
};
export declare function useSlot(): JSX.Element | null;
/** Renders the currently selected content. */
export declare function Slot(props: Omit<NavigatorProps, 'children'>): React.JSX.Element;
export declare function QualifiedSlot(): JSX.Element | null;
export declare function DefaultNavigator(): React.JSX.Element;
export {};
//# sourceMappingURL=Navigator.d.ts.map