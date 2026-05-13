import type { ExperimentalStackNavigationEventMap, ExperimentalStackNavigationOptions, ExperimentalStackNavigationProp, ExperimentalStackNavigatorProps } from './types';
import { type NavigatorTypeBagBase, type ParamListBase, type StackNavigationState, type StaticConfig, type TypedNavigator } from '../../react-navigation/native';
declare function ExperimentalStackNavigator({ id, initialRouteName, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }: ExperimentalStackNavigatorProps): import("react/jsx-runtime").JSX.Element;
export declare function createExperimentalStackNavigator<const ParamList extends ParamListBase, const NavigatorID extends string | undefined = string | undefined, const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: ExperimentalStackNavigationOptions;
    EventMap: ExperimentalStackNavigationEventMap;
    NavigationList: {
        [RouteName in keyof ParamList]: ExperimentalStackNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof ExperimentalStackNavigator;
}, const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>>(config?: Config): TypedNavigator<TypeBag, Config>;
export {};
//# sourceMappingURL=createExperimentalStackNavigator.d.ts.map