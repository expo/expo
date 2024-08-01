/// <reference types="react" />
import { LinkingOptions, ParamListBase } from '@react-navigation/native';
import { RouteNode } from '../Route';
import { Href } from '../types';
export type PolymorphicProps<E extends React.ElementType> = React.PropsWithChildren<React.ComponentPropsWithoutRef<E> & {
    as?: E;
}>;
export type ScreenTrigger<T extends string | object> = {
    href: Href<T>;
    initialRoute?: boolean;
};
export type ScreenConfig = {
    routeNode: RouteNode;
};
export declare function triggersToScreens<T extends ScreenTrigger<any>>(triggers: T[], layoutRouteNode: RouteNode, linking: LinkingOptions<ParamListBase>): {
    children: import("react").JSX.Element[];
    initialRouteName: string | undefined;
};
//# sourceMappingURL=common.d.ts.map