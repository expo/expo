import { type NavigatorTypeBagBase, type ParamListBase, type StaticConfig, type TabNavigationState, type TypedNavigator } from '../../native';
import type { BottomTabNavigationEventMap, BottomTabNavigationOptions, BottomTabNavigationProp, BottomTabNavigatorProps } from '../types';
declare function BottomTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }: BottomTabNavigatorProps): import("react").JSX.Element;
export declare function createBottomTabNavigator<const ParamList extends ParamListBase, const NavigatorID extends string | undefined = string | undefined, const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: BottomTabNavigationOptions;
    EventMap: BottomTabNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: BottomTabNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof BottomTabNavigator;
}, const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>>(config?: Config): TypedNavigator<TypeBag, Config>;
export {};
//# sourceMappingURL=createBottomTabNavigator.d.ts.map