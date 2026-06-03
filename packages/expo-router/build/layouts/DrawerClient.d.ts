import { type DrawerNavigationEventMap, type DrawerNavigationOptions } from '../react-navigation/drawer';
import type { DrawerNavigatorContentProps } from '../react-navigation/drawer/navigators/createStandardDrawerNavigator';
import { type DrawerNavigationState, type DrawerRouterOptions, type ParamListBase } from '../react-navigation/native';
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<import("../standard-navigation/types").StandardRouterNavigatorProps<DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap, DrawerNavigatorContentProps, DrawerRouterOptions>, "children"> & Partial<Pick<import("../standard-navigation/types").StandardRouterNavigatorProps<DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap, DrawerNavigatorContentProps, DrawerRouterOptions>, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<DrawerNavigationOptions, DrawerNavigationState<ParamListBase>, DrawerNavigationEventMap & import("../react-navigation").EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
export default Drawer;
//# sourceMappingURL=DrawerClient.d.ts.map