import { type ParamListBase, type Router, type StackNavigationState } from '@react-navigation/native';
export type NativeStackState = StackNavigationState<ParamListBase> & {
    poppedRoutes: Set<string>;
};
type NativeStackAction = {
    type: string;
    payload?: object;
    source?: string;
    target?: string;
};
export type NativeStackRouterOptions = {
    initialRouteName?: string;
};
export declare function NativeStackRouter({ initialRouteName, }: NativeStackRouterOptions): Router<NativeStackState, NativeStackAction>;
export {};
//# sourceMappingURL=NativeStackRouter.d.ts.map