import type { EventMapBase, NavigationState, ParamListBase, RouteConfig, RouteProp, ScreenListeners } from '@react-navigation/native';
import React from 'react';
import { RouteNode } from './Route';
export type ScreenProps<TOptions extends Record<string, any> = Record<string, any>, TState extends NavigationState = NavigationState, TEventMap extends EventMapBase = EventMapBase> = {
    /** Name is required when used inside a Layout component. */
    name?: string;
    /**
     * Redirect to the nearest sibling route.
     * If all children are `redirect={true}`, the layout will render `null` as there are no children to render.
     */
    redirect?: boolean;
    initialParams?: Record<string, any>;
    options?: TOptions | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
    }) => TOptions);
    listeners?: ScreenListeners<TState, TEventMap> | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
    }) => ScreenListeners<TState, TEventMap>);
    getId?: ({ params }: {
        params?: Record<string, any>;
    }) => string | undefined;
};
/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export declare function useSortedScreens(order: ScreenProps[]): React.ReactNode[];
/** Wrap the component with various enhancements and add access to child routes. */
export declare function getQualifiedRouteComponent(value: RouteNode): React.ComponentType<any> | React.ForwardRefExoticComponent<Omit<any, "ref"> & React.RefAttributes<unknown>>;
/** @returns a function which provides a screen id that matches the dynamic route name in params. */
export declare function createGetIdForRoute(route: Pick<RouteNode, 'dynamic' | 'route' | 'contextKey' | 'children'>): ({ params }?: {
    params?: Record<string, any> | undefined;
}) => any;
export declare function screenOptionsFactory(route: RouteNode, options?: ScreenProps['options']): RouteConfig<any, any, any, any, any, any>['options'];
export declare function routeToScreen(route: RouteNode, { options, ...props }?: Partial<ScreenProps>): React.JSX.Element;
//# sourceMappingURL=useScreens.d.ts.map