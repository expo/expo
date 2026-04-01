import * as React from 'react';
import type { ParamListBase, Route } from '../routers';
import type { NavigationProp } from './types';
/**
 * Context which holds the route prop for a screen.
 */
export declare const NavigationRouteContext: React.Context<Route<string> | undefined>;
type Props = {
    route: Route<string>;
    navigation: NavigationProp<ParamListBase>;
    children: React.ReactNode;
};
/**
 * Component to provide the navigation and route contexts to its children.
 */
export declare const NamedRouteContextListContext: React.Context<Record<string, React.Context<Route<string>>> | undefined>;
export declare function NavigationProvider({ route, navigation, children }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=NavigationProvider.d.ts.map