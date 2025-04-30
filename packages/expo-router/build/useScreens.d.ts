import { type EventMapBase, type NavigationState, type ParamListBase, type RouteProp, type ScreenListeners } from '@react-navigation/native';
import React from 'react';
import { RouteNode } from './Route';
import { UnknownOutputParams } from './types';
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
    dangerouslySingular?: SingularOptions;
};
export type SingularOptions = boolean | ((name: string, params: UnknownOutputParams) => string | undefined);
/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export declare function useSortedScreens(order: ScreenProps[], protectedScreens: Set<string>): React.ReactNode[];
/** Wrap the component with various enhancements and add access to child routes. */
export declare function getQualifiedRouteComponent(value: RouteNode): React.ComponentType<any> | {
    ({ route, navigation, ...props }: any): React.JSX.Element;
    displayName: string;
};
export declare function screenOptionsFactory(route: RouteNode, options?: ScreenProps['options']): ScreenProps['options'];
export declare function routeToScreen(route: RouteNode, { options, getId, ...props }?: Partial<ScreenProps>): React.JSX.Element;
export declare function getSingularId(name: string, options?: {
    params?: Record<string, any> | undefined;
}): string;
//# sourceMappingURL=useScreens.d.ts.map