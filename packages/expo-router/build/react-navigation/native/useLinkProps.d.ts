import * as React from 'react';
import { type GestureResponderEvent } from 'react-native';
import { type NavigationAction } from '../core';
export type LinkProps<ParamList extends ReactNavigation.RootParamList, RouteName extends keyof ParamList = keyof ParamList> = ({
    href?: string;
    action?: NavigationAction;
} & (RouteName extends unknown ? undefined extends ParamList[RouteName] ? {
    screen: RouteName;
    params?: ParamList[RouteName];
} : {
    screen: RouteName;
    params: ParamList[RouteName];
} : never)) | {
    href?: string;
    action: NavigationAction;
    screen?: undefined;
    params?: undefined;
};
/**
 * Hook to get props for an anchor tag so it can work with in page navigation.
 *
 * @param props.screen Name of the screen to navigate to (e.g. `'Feeds'`).
 * @param props.params Params to pass to the screen to navigate to (e.g. `{ sort: 'hot' }`).
 * @param props.href Optional absolute path to use for the href (e.g. `/feeds/hot`).
 * @param props.action Optional action to use for in-page navigation. By default, the path is parsed to an action based on linking config.
 */
export declare function useLinkProps<ParamList extends ReactNavigation.RootParamList>({ screen, params, href, action, }: LinkProps<ParamList>): {
    href: string | undefined;
    role: "link";
    onPress: (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
};
//# sourceMappingURL=useLinkProps.d.ts.map