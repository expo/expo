import { type DrawerStatus } from '../../native';
import type { DrawerNavigationConfig, DrawerNavigationEventMap, DrawerNavigationOptions } from '../types';
/**
 * Props injected into the drawer's `NavigatorContent` on top of the standard-navigation `NavigatorArgs`.
 * `defaultStatus`/`drawerContent`/`detachInactiveScreens` flow in as plain navigator props; the rest are
 * derived from the raw navigator state/dispatch/navigation in `DrawerClient`'s `createProps`.
 *
 * All of these are optional on the public navigator component (the user never passes them); `createProps`
 * supplies them at runtime, so the content component asserts their presence when forwarding to `DrawerView`.
 */
export interface DrawerNavigatorContentProps extends DrawerNavigationConfig {
    defaultStatus?: DrawerStatus;
    drawerStatus?: DrawerStatus;
    preloadedRouteKeys?: readonly string[];
    navigatorKey?: string;
    isFocused?: () => boolean;
    openDrawer?: () => void;
    closeDrawer?: () => void;
    toggleDrawer?: () => void;
    handlePopToTopOnBlur?: (routeKey: string) => void;
}
export declare const createStandardDrawerNavigator: {
    readonly type: "standard";
    readonly version: 1;
    readonly NavigatorContent: import("react").ComponentType<import("standard-navigation").NavigatorArgs<DrawerNavigationOptions, DrawerNavigationEventMap> & Omit<DrawerNavigatorContentProps, keyof import("standard-navigation").NavigatorArgs<NavigatorOptions, NavigatorEventMap>>>;
};
//# sourceMappingURL=createStandardDrawerNavigator.d.ts.map