import { type NavigatorTypeBagBase, type ParamListBase, type StaticConfig, type TabNavigationState, type TypedNavigator } from '../../native';
import type { MaterialTopTabNavigationEventMap, MaterialTopTabNavigationOptions, MaterialTopTabNavigationProp, MaterialTopTabNavigatorProps } from '../types';
declare function MaterialTopTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }: MaterialTopTabNavigatorProps): import("react").JSX.Element;
export declare function createMaterialTopTabNavigator<const ParamList extends ParamListBase, const NavigatorID extends string | undefined = string | undefined, const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: MaterialTopTabNavigationOptions;
    EventMap: MaterialTopTabNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: MaterialTopTabNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof MaterialTopTabNavigator;
}, const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>>(config?: Config): TypedNavigator<TypeBag, Config>;
export {};
//# sourceMappingURL=createMaterialTopTabNavigator.d.ts.map