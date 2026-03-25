import { type DefaultNavigatorOptions, type EventMapBase, type NavigationListBase, type ParamListBase, type StackNavigationState, type TypedNavigator } from '../../core';
declare const StackNavigator: (props: DefaultNavigatorOptions<ParamListBase, string | undefined, StackNavigationState<ParamListBase>, object, EventMapBase, unknown>) => import("react").JSX.Element;
export declare function createStackNavigator<ParamList extends ParamListBase>(): TypedNavigator<{
    ParamList: ParamList;
    NavigatorID: string | undefined;
    State: StackNavigationState<ParamList>;
    ScreenOptions: {};
    EventMap: {};
    NavigationList: NavigationListBase<ParamList>;
    Navigator: typeof StackNavigator;
}>;
export {};
//# sourceMappingURL=createStackNavigator.d.ts.map