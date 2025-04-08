import { DefaultNavigatorOptions, ParamListBase, TabActionHelpers, TabNavigationState, TabRouterOptions } from '@react-navigation/native';
import { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import { ExpoTabsScreenOptions, TabNavigationEventMap, TabsContextValue } from './TabContext';
import { ScreenTrigger } from './common';
export * from './TabContext';
export * from './TabList';
export * from './TabSlot';
export * from './TabTrigger';
export { ExpoTabsResetValue } from './TabRouter';
/**
 * Options to provide to the Tab Router.
 */
export type UseTabsOptions = Omit<DefaultNavigatorOptions<ParamListBase, any, TabNavigationState<any>, ExpoTabsScreenOptions, TabNavigationEventMap, any>, 'children'> & {
    backBehavior?: TabRouterOptions['backBehavior'];
};
export type TabsProps = ViewProps & {
    /** Forward props to child component and removes the extra `<View>`. Useful for custom wrappers. */
    asChild?: boolean;
    options?: UseTabsOptions;
};
/**
 * Root component for the headless tabs.
 *
 * @see [`useTabsWithChildren`](#usetabswithchildrenoptions) for a hook version of this component.
 * @example
 * ```tsx
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
export declare function Tabs(props: TabsProps): import("react").JSX.Element;
export type UseTabsWithChildrenOptions = PropsWithChildren<UseTabsOptions>;
export type UseTabsWithTriggersOptions = UseTabsOptions & {
    triggers: ScreenTrigger[];
};
/**
 * Hook version of `Tabs`. The returned NavigationContent component
 * should be rendered. Using the hook requires using the `<TabList />`
 * and `<TabTrigger />` components exported from Expo Router.
 *
 * The `useTabsWithTriggers()` hook can be used for custom components.
 *
 * @see [`Tabs`](#tabs) for the component version of this hook.
 * @example
 * ```tsx
 * export function MyTabs({ children }) {
 *  const { NavigationContent } = useTabsWithChildren({ children })
 *
 *  return <NavigationContent />
 * }
 * ```
 */
export declare function useTabsWithChildren(options: UseTabsWithChildrenOptions): {
    state: TabNavigationState<any>;
    navigation: {
        dispatch(action: Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }> | ((state: Readonly<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>) => import("@react-navigation/native").NavigationAction)): void;
        navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined, options?: {
            merge?: boolean;
            pop?: boolean;
        } | undefined] : never): void;
        navigate<RouteName extends string>(options: RouteName extends unknown ? {
            name: RouteName;
            params: object | undefined;
            path?: string;
            merge?: boolean;
            pop?: boolean;
        } : never): void;
        navigateDeprecated<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
        navigateDeprecated<RouteName extends string>(options: RouteName extends unknown ? {
            name: RouteName;
            params: object | undefined;
            merge?: boolean;
        } : never): void;
        preload<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>;
        setStateForNextRouteNamesChange(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<TabNavigationEventMap> & {
        setParams<RouteName extends string>(params: Partial<object | undefined>): void;
    } & TabActionHelpers<ParamListBase>;
    describe: (route: import("@react-navigation/native").RouteProp<ParamListBase>, placeholder: boolean) => import("@react-navigation/native").Descriptor<import("./TabContext").ExpoTabsNavigatorScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }> | ((state: Readonly<TabNavigationState<any>>) => Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }>)): void;
        navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined, options?: {
            merge?: boolean;
            pop?: boolean;
        } | undefined] : never): void;
        navigate<RouteName extends string>(options: RouteName extends unknown ? {
            name: RouteName;
            params: object | undefined;
            path?: string;
            merge?: boolean;
            pop?: boolean;
        } : never): void;
        navigateDeprecated<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
        navigateDeprecated<RouteName extends string>(options: RouteName extends unknown ? {
            name: RouteName;
            params: object | undefined;
            merge?: boolean;
        } : never): void;
        preload<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
        reset(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): TabNavigationState<any>;
        setStateForNextRouteNamesChange(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T = import("@react-navigation/native").NavigationProp<ParamListBase, string, undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<import("./TabContext").ExpoTabsNavigatorScreenOptions>): void;
    } & import("@react-navigation/native").EventConsumer<TabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<any>>> & import("@react-navigation/native").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/native").RouteProp<ParamListBase, string>>;
    descriptors: Record<string, import("@react-navigation/native").Descriptor<import("./TabContext").ExpoTabsNavigatorScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }> | ((state: Readonly<TabNavigationState<any>>) => Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }>)): void;
        navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined, options?: {
            merge?: boolean;
            pop?: boolean;
        } | undefined] : never): void;
        navigate<RouteName extends string>(options: RouteName extends unknown ? {
            name: RouteName;
            params: object | undefined;
            path?: string;
            merge?: boolean;
            pop?: boolean;
        } : never): void;
        navigateDeprecated<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
        navigateDeprecated<RouteName extends string>(options: RouteName extends unknown ? {
            name: RouteName;
            params: object | undefined;
            merge?: boolean;
        } : never): void;
        preload<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
        reset(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): TabNavigationState<any>;
        setStateForNextRouteNamesChange(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T = import("@react-navigation/native").NavigationProp<ParamListBase, string, undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<import("./TabContext").ExpoTabsNavigatorScreenOptions>): void;
    } & import("@react-navigation/native").EventConsumer<TabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<any>>> & import("@react-navigation/native").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
    NavigationContent: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
};
/**
 * Alternative hook version of `Tabs` that uses explicit triggers
 * instead of `children`.
 *
 * @see [`Tabs`](#tabs) for the component version of this hook.
 * @example
 * ```tsx
 * export function MyTabs({ children }) {
 *   const { NavigationContent } = useTabsWithChildren({ triggers: [] })
 *
 *   return <NavigationContent />
 * }
 * ```
 */
export declare function useTabsWithTriggers(options: UseTabsWithTriggersOptions): TabsContextValue;
//# sourceMappingURL=Tabs.d.ts.map