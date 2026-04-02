import * as React from 'react';
import { Animated } from 'react-native';
import { type Route } from '../../../native';
import type { Layout, Scene } from '../../types';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';
type Props = {
    interpolationIndex: number;
    index: number;
    active: boolean;
    focused: boolean;
    opening: boolean;
    closing: boolean;
    modal: boolean;
    layout: Layout;
    gesture: Animated.Value;
    preloaded: boolean;
    scene: Scene;
    safeAreaInsetTop: number;
    safeAreaInsetRight: number;
    safeAreaInsetBottom: number;
    safeAreaInsetLeft: number;
    getPreviousScene: (props: {
        route: Route<string>;
    }) => Scene | undefined;
    getFocusedRoute: () => Route<string>;
    renderHeader: (props: HeaderContainerProps) => React.ReactNode;
    onOpenRoute: (props: {
        route: Route<string>;
    }) => void;
    onCloseRoute: (props: {
        route: Route<string>;
    }) => void;
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
    hasAbsoluteFloatHeader: boolean;
    headerHeight: number;
    onHeaderHeightChange: (props: {
        route: Route<string>;
        height: number;
    }) => void;
    isParentHeaderShown: boolean;
    isNextScreenTransparent: boolean;
    detachCurrentScreen: boolean;
};
declare function CardContainerInner({ interpolationIndex, index, active, opening, closing, gesture, focused, modal, getPreviousScene, getFocusedRoute, hasAbsoluteFloatHeader, headerHeight, onHeaderHeightChange, isParentHeaderShown, isNextScreenTransparent, detachCurrentScreen, layout, onCloseRoute, onOpenRoute, onGestureCancel, onGestureEnd, onGestureStart, onTransitionEnd, onTransitionStart, preloaded, renderHeader, safeAreaInsetBottom, safeAreaInsetLeft, safeAreaInsetRight, safeAreaInsetTop, scene, }: Props): React.JSX.Element;
export declare const CardContainer: React.MemoExoticComponent<typeof CardContainerInner>;
export {};
//# sourceMappingURL=CardContainer.d.ts.map