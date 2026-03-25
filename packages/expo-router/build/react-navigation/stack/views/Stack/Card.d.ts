import * as React from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { LocaleDirection } from '../../../native';
import type { GestureDirection, Layout, StackCardStyleInterpolator, TransitionSpec } from '../../types';
type Props = {
    animated: boolean;
    interpolationIndex: number;
    opening: boolean;
    closing: boolean;
    next: Animated.AnimatedInterpolation<number> | undefined;
    current: Animated.AnimatedInterpolation<number>;
    gesture: Animated.Value;
    layout: Layout;
    insets: EdgeInsets;
    direction: LocaleDirection;
    pageOverflowEnabled: boolean;
    gestureDirection: GestureDirection;
    onOpen: () => void;
    onClose: () => void;
    onTransition: (props: {
        closing: boolean;
        gesture: boolean;
    }) => void;
    onGestureBegin: () => void;
    onGestureCanceled: () => void;
    onGestureEnd: () => void;
    children: React.ReactNode;
    overlay: ((props: {
        style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    }) => React.ReactNode) | undefined;
    overlayEnabled: boolean;
    shadowEnabled: boolean | undefined;
    gestureEnabled: boolean;
    gestureResponseDistance?: number;
    gestureVelocityImpact: number | undefined;
    transitionSpec: {
        open: TransitionSpec;
        close: TransitionSpec;
    };
    preloaded: boolean;
    styleInterpolator: StackCardStyleInterpolator;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
};
declare function Card({ shadowEnabled, gestureEnabled, gestureVelocityImpact, overlay, animated, interpolationIndex, opening, closing, next, current, gesture, layout, insets, direction, pageOverflowEnabled, gestureDirection, onOpen, onClose, onTransition, onGestureBegin, onGestureCanceled, onGestureEnd, children, overlayEnabled, gestureResponseDistance, transitionSpec, preloaded, styleInterpolator, containerStyle: customContainerStyle, contentStyle, }: Props): React.JSX.Element;
export { Card };
//# sourceMappingURL=Card.d.ts.map