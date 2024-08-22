/// <reference types="react" />
import { LinkingOptions, ParamListBase } from '@react-navigation/native';
import { ViewProps, View } from 'react-native';
import type { ExpoTabActionType } from './TabRouter';
import { RouteNode } from '../Route';
import { Href } from '../types';
export declare const ViewSlot: import("react").ForwardRefExoticComponent<ViewProps & import("react").RefAttributes<View>>;
export type ScreenTrigger<T extends string | object> = {
    type: 'internal';
    href: Href<T>;
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
export declare function triggersToScreens(triggers: ScreenTrigger<any>[], layoutRouteNode: RouteNode, linking: LinkingOptions<ParamListBase>, initialRouteName: undefined | string): {
    children: import("react").JSX.Element[];
    triggerMap: TriggerMap;
};
export {};
//# sourceMappingURL=common.d.ts.map