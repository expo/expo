import React from 'react';
import { RouteNode } from './Route';
export type ScreenProps<TOptions extends Record<string, any> = Record<string, any>> = {
    /** Name is required when used inside a Layout component. */
    name?: string;
    /**
     * Redirect to the nearest sibling route.
     * If all children are redirect={true}, the layout will render `null` as there are no children to render.
     */
    redirect?: boolean;
    initialParams?: {
        [key: string]: any;
    };
    options?: TOptions;
    listeners?: any;
    getId?: ({ params }: {
        params?: Record<string, any> | undefined;
    }) => string | undefined;
};
/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export declare function useSortedScreens(order: ScreenProps[]): React.ReactNode[];
/** Wrap the component with various enhancements and add access to child routes. */
export declare function getQualifiedRouteComponent(value: RouteNode): React.ComponentType<any> | React.ForwardRefExoticComponent<Pick<any, string | number | symbol> & React.RefAttributes<unknown>>;
/** @returns a function which provides a screen id that matches the dynamic route name in params. */
export declare function createGetIdForRoute(route: Pick<RouteNode, 'dynamic' | 'route'>): (({ params }: {
    params?: Record<string, any> | undefined;
}) => string | undefined) | undefined;
//# sourceMappingURL=useScreens.d.ts.map