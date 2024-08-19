/// <reference types="react" />
import { LinkingOptions, ParamListBase } from '@react-navigation/native';
import { PressableProps, ViewProps, View } from 'react-native';
import { RouteNode } from '../Route';
import { Href } from '../types';
export declare const ViewSlot: import("react").ForwardRefExoticComponent<ViewProps & import("react").RefAttributes<View>>;
export declare const PressableSlot: import("react").ForwardRefExoticComponent<PressableProps & import("react").RefAttributes<import("react").ForwardRefExoticComponent<PressableProps & import("react").RefAttributes<View>>>>;
export type ScreenTrigger<T extends string | object> = {
    href: Href<T>;
    name: string;
};
export type ResolvedScreenTrigger = {
    href: string;
    name: string;
};
export type TriggerMap = Map<string, {
    navigate: any;
    switch: any;
}>;
export declare function triggersToScreens(triggers: ScreenTrigger<any>[] | ResolvedScreenTrigger[], layoutRouteNode: RouteNode, linking: LinkingOptions<ParamListBase>, initialRouteName: undefined | string): {
    children: import("react").JSX.Element[];
    triggerMap: TriggerMap;
};
//# sourceMappingURL=common.d.ts.map