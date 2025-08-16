import type { LinkingOptions, ParamListBase, PartialRoute, Route } from '@react-navigation/native';
import { type ViewProps, View } from 'react-native';
import type { ExpoTabActionType } from './TabRouter';
import type { UrlObject } from '../LocationProvider';
import type { RouteNode } from '../Route';
import type { Href } from '../types';
export declare const ViewSlot: React.ForwardRefExoticComponent<ViewProps & React.RefAttributes<View>>;
export type ScreenTrigger = {
    type: 'internal';
    href: Href;
    name: string;
} | {
    type: 'external';
    name: string;
    href: string;
};
type JumpToNavigationAction = Extract<ExpoTabActionType, {
    type: 'JUMP_TO';
}>;
type TriggerConfig = {
    type: 'internal';
    name: string;
    href: string;
    routeNode: RouteNode;
    action: JumpToNavigationAction;
} | {
    type: 'external';
    name: string;
    href: string;
};
export type TriggerMap = Record<string, TriggerConfig & {
    index: number;
}>;
export declare function triggersToScreens(triggers: ScreenTrigger[], layoutRouteNode: RouteNode, linking: LinkingOptions<ParamListBase>, initialRouteName: undefined | string, parentTriggerMap: TriggerMap, routeInfo: UrlObject, contextKey: string): {
    children: import("react").JSX.Element[];
    triggerMap: TriggerMap;
};
export declare function stateToAction(state: PartialRoute<Route<string, object | undefined>> | undefined, startAtRoute?: string): JumpToNavigationAction;
export {};
//# sourceMappingURL=common.d.ts.map