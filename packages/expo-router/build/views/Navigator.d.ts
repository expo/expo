import { RouterFactory, StackRouter, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
export type NavigatorContextValue = ReturnType<typeof useNavigationBuilder> & {
    contextKey: string;
    router: RouterFactory<any, any, any>;
};
export declare const NavigatorContext: React.Context<NavigatorContextValue | null>;
type UseNavigationBuilderRouter = Parameters<typeof useNavigationBuilder>[0];
type UseNavigationBuilderOptions = Parameters<typeof useNavigationBuilder>[1];
export type NavigatorProps<T extends UseNavigationBuilderRouter> = {
    initialRouteName?: UseNavigationBuilderOptions['initialRouteName'];
    screenOptions?: UseNavigationBuilderOptions['screenOptions'];
    children?: UseNavigationBuilderOptions['children'];
    router?: T;
    routerOptions?: Omit<Parameters<T>[0], 'initialRouteName'>;
};
/**
 * An unstyled custom navigator. Good for basic web layouts.
 *
 * @hidden
 */
export declare function Navigator<T extends UseNavigationBuilderRouter = typeof StackRouter>({ initialRouteName, screenOptions, children, router, routerOptions, }: NavigatorProps<T>): React.JSX.Element | null;
export declare namespace Navigator {
    var Slot: typeof NavigatorSlot;
    var useContext: typeof useNavigatorContext;
    var Screen: typeof import("./Screen").Screen;
}
/**
 * @hidden
 */
export declare function useNavigatorContext(): NavigatorContextValue;
/**
 * Renders the currently selected content.
 *
 * There are actually two different implementations of `<Slot/>`:
 *  - Used inside a `_layout` as the `Navigator`
 *  - Used inside a `Navigator` as the content
 *
 * Since a custom `Navigator` will set the `NavigatorContext.contextKey` to
 * the current `_layout`, you can use this to determine if you are inside
 * a custom navigator or not.
 */
export declare function Slot(props: Omit<NavigatorProps<any>, 'children'>): React.JSX.Element;
/**
 * Render the current navigator content.
 */
declare function NavigatorSlot(): JSX.Element;
/**
 * The default navigator for the app when no root _layout is provided.
 */
export declare function DefaultNavigator(): React.JSX.Element;
export {};
//# sourceMappingURL=Navigator.d.ts.map