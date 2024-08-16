/// <reference types="react" />
import { LinkingOptions, ParamListBase } from '@react-navigation/native';
import { RouteNode } from '../Route';
import { Href } from '../types';
export type ScreenTrigger<T extends string | object> = {
    href: Href<T>;
};
export type ScreenConfig = {
    routeNode: RouteNode;
};
export declare function triggersToScreens<T extends string | object>(triggers: ScreenTrigger<T>[], layoutRouteNode: RouteNode, linking: LinkingOptions<ParamListBase>, initialRouteName: undefined | string): {
    children: import("react").JSX.Element[];
};
//# sourceMappingURL=common.d.ts.map