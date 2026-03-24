import * as React from 'react';
import { type LocaleDirection, type ParamListBase, type Route, type RouteProp, type StackNavigationState } from '../../../native';
import type { StackDescriptor, StackDescriptorMap, StackNavigationConfig, StackNavigationHelpers } from '../../types';
type Props = StackNavigationConfig & {
    direction: LocaleDirection;
    state: StackNavigationState<ParamListBase>;
    navigation: StackNavigationHelpers;
    descriptors: StackDescriptorMap;
    describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => StackDescriptor;
};
type State = {
    routes: Route<string>[];
    previousState: StackNavigationState<ParamListBase> | undefined;
    previousDescriptors: StackDescriptorMap;
    openingRouteKeys: string[];
    closingRouteKeys: string[];
    replacingRouteKeys: string[];
    descriptors: StackDescriptorMap;
};
export declare class StackView extends React.Component<Props, State> {
    static getDerivedStateFromProps(props: Readonly<Props>, state: Readonly<State>): {
        routes: Route<string>[];
        previousState: StackNavigationState<ParamListBase>;
        descriptors: StackDescriptorMap;
        previousDescriptors: StackDescriptorMap;
        openingRouteKeys?: undefined;
        closingRouteKeys?: undefined;
        replacingRouteKeys?: undefined;
    } | {
        routes: import("../../../native").NavigationRoute<ParamListBase, string>[];
        previousState: StackNavigationState<ParamListBase>;
        previousDescriptors: StackDescriptorMap;
        openingRouteKeys: string[];
        closingRouteKeys: string[];
        replacingRouteKeys: string[];
        descriptors: StackDescriptorMap;
    };
    state: State;
    private getPreviousRoute;
    private renderHeader;
    private handleOpenRoute;
    private handleCloseRoute;
    private handleTransitionStart;
    private handleTransitionEnd;
    private handleGestureStart;
    private handleGestureEnd;
    private handleGestureCancel;
    render(): React.JSX.Element;
}
export {};
//# sourceMappingURL=StackView.d.ts.map