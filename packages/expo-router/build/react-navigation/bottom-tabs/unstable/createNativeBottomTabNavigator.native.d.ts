import * as React from 'react';
import type { NativeBottomTabNavigationEventMap, NativeBottomTabNavigationOptions, NativeBottomTabNavigationProp, NativeBottomTabNavigatorProps } from './types';
import { type NavigatorTypeBagBase, type ParamListBase, type StaticConfig, type TabNavigationState, type TypedNavigator } from '../../native';
declare function NativeBottomTabNavigator({ id, initialRouteName, backBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, UNSTABLE_routeNamesChangeBehavior, ...rest }: NativeBottomTabNavigatorProps): React.JSX.Element;
export declare function createNativeBottomTabNavigator<const ParamList extends ParamListBase, const NavigatorID extends string | undefined = string | undefined, const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: NativeBottomTabNavigationOptions;
    EventMap: NativeBottomTabNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: NativeBottomTabNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof NativeBottomTabNavigator;
}, const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>>(config?: Config): TypedNavigator<TypeBag, Config>;
export {};
//# sourceMappingURL=createNativeBottomTabNavigator.native.d.ts.map