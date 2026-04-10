import * as React from 'react';
import { type NavigatorTypeBagBase, type ParamListBase, type StackNavigationState, type StaticConfig, type TypedNavigator } from '../../native';
import type { StackNavigationEventMap, StackNavigationOptions, StackNavigationProp, StackNavigatorProps } from '../types';
declare function StackNavigator({ id, initialRouteName, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }: StackNavigatorProps): React.JSX.Element;
export declare function createStackNavigator<const ParamList extends ParamListBase, const NavigatorID extends string | undefined = string | undefined, const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: StackNavigationOptions;
    EventMap: StackNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: StackNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof StackNavigator;
}, const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>>(config?: Config): TypedNavigator<TypeBag, Config>;
export {};
//# sourceMappingURL=createStackNavigator.d.ts.map