import { StackRouterOptions } from '@react-navigation/native';
export declare function StackRouter(options: StackRouterOptions): {
    getStateForAction(state: any, action: any, options: any): any;
    type: "stack";
    getInitialState(options: import("@react-navigation/native").RouterConfigOptions): import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>;
    getRehydratedState(partialState: import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase> | import("@react-navigation/native").PartialState<import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>>, options: import("@react-navigation/native").RouterConfigOptions): import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>;
    getStateForRouteNamesChange(state: import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>, options: import("@react-navigation/native").RouterConfigOptions & {
        routeKeyChanges: string[];
    }): import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>;
    getStateForRouteFocus(state: import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>, key: string): import("@react-navigation/native").StackNavigationState<import("@react-navigation/native").ParamListBase>;
    shouldActionChangeFocus(action: Readonly<{
        type: string;
        payload?: object | undefined;
        source?: string | undefined;
        target?: string | undefined;
    }>): boolean;
    actionCreators?: import("@react-navigation/native").ActionCreators<import("@react-navigation/routers/lib/typescript/commonjs/src/CommonActions").Action | import("@react-navigation/native").StackActionType> | undefined;
};
//# sourceMappingURL=StackRouter.d.ts.map