import * as React from 'react';
import { Animated } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { LocaleDirection, ParamListBase, Route, StackNavigationState } from '../../../native';
import type { Layout, Scene, StackAnimationName, StackDescriptorMap } from '../../types';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';
type GestureValues = {
    [key: string]: Animated.Value;
};
type Props = {
    direction: LocaleDirection;
    insets: EdgeInsets;
    state: StackNavigationState<ParamListBase>;
    descriptors: StackDescriptorMap;
    preloadedDescriptors: StackDescriptorMap;
    routes: Route<string>[];
    openingRouteKeys: string[];
    closingRouteKeys: string[];
    onOpenRoute: (props: {
        route: Route<string>;
    }) => void;
    onCloseRoute: (props: {
        route: Route<string>;
    }) => void;
    getPreviousRoute: (props: {
        route: Route<string>;
    }) => Route<string> | undefined;
    renderHeader: (props: HeaderContainerProps) => React.ReactNode;
    isParentHeaderShown: boolean;
    isParentModal: boolean;
    onTransitionStart: (props: {
        route: Route<string>;
    }, closing: boolean) => void;
    onTransitionEnd: (props: {
        route: Route<string>;
    }, closing: boolean) => void;
    onGestureStart: (props: {
        route: Route<string>;
    }) => void;
    onGestureEnd: (props: {
        route: Route<string>;
    }) => void;
    onGestureCancel: (props: {
        route: Route<string>;
    }) => void;
    detachInactiveScreens?: boolean;
};
type State = {
    routes: Route<string>[];
    descriptors: StackDescriptorMap;
    scenes: Scene[];
    gestures: GestureValues;
    layout: Layout;
    activeStates: (0 | 1 | Animated.AnimatedInterpolation<0 | 1>)[];
    headerHeights: Record<string, number>;
};
export declare function getAnimationEnabled(animation: StackAnimationName | undefined): boolean;
export declare class CardStack extends React.Component<Props, State> {
    static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null;
    constructor(props: Props);
    private handleLayout;
    private handleHeaderLayout;
    private getFocusedRoute;
    private getPreviousScene;
    render(): React.JSX.Element;
}
export {};
//# sourceMappingURL=CardStack.d.ts.map