import * as React from 'react';
import type { NavigationState, ParamListBase } from '../routers';
import type { DefaultNavigatorOptions, EventMapBase, NavigationListBase, NavigatorScreenParams, NavigatorTypeBagBase, PathConfig, RouteConfigComponent, RouteConfigProps, RouteGroupConfig } from './types';
/**
 * Flatten a type to remove all type alias names, unions etc.
 * This will show a plain object when hovering over the type.
 */
type FlatType<T> = {
    [K in keyof T]: T[K];
} & {};
/**
 * keyof T doesn't work for union types. We can use distributive conditional types instead.
 * https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
 */
type KeysOf<T> = T extends {} ? keyof T : never;
/**
 * We get a union type when using keyof, but we want an intersection instead.
 * https://stackoverflow.com/a/50375286/1665026
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type UnknownToUndefined<T> = unknown extends T ? undefined : T;
type ParamsForScreenComponent<T> = T extends {
    screen: React.ComponentType<{
        route: {
            params: infer P;
        };
    }>;
} ? P : T extends React.ComponentType<{
    route: {
        params: infer P;
    };
}> ? P : undefined;
type ParamsForScreen<T> = T extends {
    screen: StaticNavigation<any, any, any>;
} ? NavigatorScreenParams<StaticParamList<T['screen']>> | undefined : T extends StaticNavigation<any, any, any> ? NavigatorScreenParams<StaticParamList<T>> | undefined : UnknownToUndefined<ParamsForScreenComponent<T>>;
type ParamListForScreens<Screens> = {
    [Key in KeysOf<Screens>]: ParamsForScreen<Screens[Key]>;
};
type ParamListForGroups<Groups extends Readonly<{
    [key: string]: {
        screens: StaticConfigScreens<ParamListBase, NavigationState, {}, EventMapBase, any>;
    };
}> | undefined> = Groups extends {
    [key: string]: {
        screens: StaticConfigScreens<ParamListBase, NavigationState, {}, EventMapBase, any>;
    };
} ? ParamListForScreens<UnionToIntersection<Groups[keyof Groups]['screens']>> : {};
type StaticRouteConfig<ParamList extends ParamListBase, RouteName extends keyof ParamList, State extends NavigationState, ScreenOptions extends {}, EventMap extends EventMapBase, Navigation> = RouteConfigProps<ParamList, RouteName, State, ScreenOptions, EventMap, Navigation> & RouteConfigComponent<ParamList, RouteName>;
export type StaticConfigScreens<ParamList extends ParamListBase, State extends NavigationState, ScreenOptions extends {}, EventMap extends EventMapBase, NavigationList extends NavigationListBase<ParamList>> = {
    [RouteName in keyof ParamList]: React.ComponentType<any> | StaticNavigation<any, any, any> | (Omit<StaticRouteConfig<ParamList, RouteName, State, ScreenOptions, EventMap, NavigationList[RouteName]>, 'name' | 'component' | 'getComponent' | 'children'> & {
        /**
         * Callback to determine whether the screen should be rendered or not.
         * This can be useful for conditional rendering of screens,
         * e.g. - if you want to render a different screen for logged in users.
         *
         * You can use a custom hook to use custom logic to determine the return value.
         *
         * @example
         * ```js
         * if: useIsLoggedIn
         * ```
         */
        if?: () => boolean;
        /**
         * Linking config for the screen.
         * This can be a string to specify the path, or an object with more options.
         *
         * @example
         * ```js
         * linking: {
         *   path: 'profile/:id',
         *   exact: true,
         * },
         * ```
         */
        linking?: PathConfig<ParamList> | string;
        /**
         * Static navigation config or Component to render for the screen.
         */
        screen: StaticNavigation<any, any, any> | React.ComponentType<any>;
    });
};
export type StaticConfigGroup<ParamList extends ParamListBase, State extends NavigationState, ScreenOptions extends {}, EventMap extends EventMapBase, NavigationList extends NavigationListBase<ParamList>> = Omit<RouteGroupConfig<ParamList, ScreenOptions, NavigationList[keyof ParamList]>, 'screens' | 'children'> & {
    /**
     * Callback to determine whether the screens in the group should be rendered or not.
     * This can be useful for conditional rendering of group of screens.
     */
    if?: () => boolean;
    /**
     * Static navigation config or Component to render for the screen.
     */
    screens: StaticConfigScreens<ParamList, State, ScreenOptions, EventMap, NavigationList>;
};
export type StaticConfig<Bag extends NavigatorTypeBagBase> = StaticConfigInternal<Bag['ParamList'], Bag['NavigatorID'], Bag['State'], Bag['ScreenOptions'], Bag['EventMap'], Bag['NavigationList'], Bag['Navigator']>;
type StaticConfigInternal<ParamList extends ParamListBase, NavigatorID extends string | undefined, State extends NavigationState, ScreenOptions extends {}, EventMap extends EventMapBase, NavigationList extends NavigationListBase<ParamList>, Navigator extends React.ComponentType<any>> = Omit<Omit<React.ComponentProps<Navigator>, keyof DefaultNavigatorOptions<ParamListBase, string | undefined, NavigationState, {}, EventMapBase, NavigationList[keyof ParamList]>> & DefaultNavigatorOptions<ParamList, NavigatorID, State, ScreenOptions, EventMap, NavigationList[keyof ParamList]>, 'screens' | 'children'> & ({
    /**
     * Screens to render in the navigator and their configuration.
     */
    screens: StaticConfigScreens<ParamList, State, ScreenOptions, EventMap, NavigationList>;
    /**
     * Groups of screens to render in the navigator and their configuration.
     */
    groups?: {
        [key: string]: StaticConfigGroup<ParamList, State, ScreenOptions, EventMap, NavigationList>;
    };
} | {
    /**
     * Screens to render in the navigator and their configuration.
     */
    screens?: StaticConfigScreens<ParamList, State, ScreenOptions, EventMap, NavigationList>;
    /**
     * Groups of screens to render in the navigator and their configuration.
     */
    groups: {
        [key: string]: StaticConfigGroup<ParamList, State, ScreenOptions, EventMap, NavigationList>;
    };
});
/**
 * Props for a screen component which is rendered by a static navigator.
 * Takes the route params as a generic argument.
 */
export type StaticScreenProps<T extends Record<string, unknown> | undefined> = {
    route: {
        params: T;
    };
};
/**
 * Infer the param list from the static navigation config.
 */
export type StaticParamList<T extends {
    readonly config: {
        readonly screens?: Record<string, any>;
        readonly groups?: {
            [key: string]: {
                screens: Record<string, any>;
            };
        };
    };
}> = FlatType<ParamListForScreens<T['config']['screens']> & ParamListForGroups<T['config']['groups']>>;
export type StaticNavigation<NavigatorProps, GroupProps, ScreenProps> = {
    Navigator: React.ComponentType<NavigatorProps>;
    Group: React.ComponentType<GroupProps>;
    Screen: React.ComponentType<ScreenProps>;
    config: StaticConfig<NavigatorTypeBagBase>;
};
/**
 * Create a component that renders a navigator based on the static configuration.
 *
 * @param tree Static navigation config.
 * @param displayName Name of the component to be displayed in React DevTools.
 * @returns A component which renders the navigator.
 */
export declare function createComponentForStaticNavigation(tree: StaticNavigation<any, any, any>, displayName: string): React.ComponentType<{}>;
type TreeForPathConfig = {
    config: {
        initialRouteName?: string;
        screens?: StaticConfigScreens<ParamListBase, NavigationState, {}, EventMapBase, Record<string, unknown>>;
        groups?: {
            [key: string]: {
                screens: StaticConfigScreens<ParamListBase, NavigationState, {}, EventMapBase, Record<string, unknown>>;
            };
        };
    };
};
/**
 * Create a path config object from a static navigation config for deep linking.
 *
 * @param tree Static navigation config.
 * @param options Additional options from `linking.config`.
 * @param auto Whether to automatically generate paths for leaf screens.
 * @returns Path config object to use in linking config.
 *
 * @example
 * ```js
 * const config = {
 *   screens: {
 *     Home: {
 *       screens: createPathConfigForStaticNavigation(HomeTabs),
 *     },
 *   },
 * };
 * ```
 */
export declare function createPathConfigForStaticNavigation(tree: TreeForPathConfig, options?: {
    initialRouteName?: string;
}, auto?: boolean): {} | undefined;
export {};
//# sourceMappingURL=StaticNavigation.d.ts.map