import { type DrawerNavigationState, type NavigatorTypeBagBase, type ParamListBase, type StaticConfig, type TypedNavigator } from '@react-navigation/native';
import type { DrawerNavigationEventMap, DrawerNavigationOptions, DrawerNavigationProp, DrawerNavigatorProps } from '../types';
declare function DrawerNavigator({ id, initialRouteName, defaultStatus, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }: DrawerNavigatorProps): import("react").JSX.Element;
export declare function createDrawerNavigator<const ParamList extends ParamListBase, const NavigatorID extends string | undefined = undefined, const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: DrawerNavigationState<ParamList>;
    ScreenOptions: DrawerNavigationOptions;
    EventMap: DrawerNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: DrawerNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof DrawerNavigator;
}, const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>>(config?: Config): TypedNavigator<TypeBag, Config>;
export {};
//# sourceMappingURL=createDrawerNavigator.d.ts.map