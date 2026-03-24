import * as React from 'react';
import { Animated, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
type HoverEffectProps = {
    color?: string;
    hoverOpacity?: number;
    activeOpacity?: number;
};
export type Props = Omit<PressableProps, 'style' | 'onPress'> & {
    href?: string;
    pressColor?: string;
    pressOpacity?: number;
    hoverEffect?: HoverEffectProps;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
    children: React.ReactNode;
};
export declare const PlatformPressable: React.ForwardRefExoticComponent<Omit<PressableProps, "style" | "onPress"> & {
    href?: string;
    pressColor?: string;
    pressOpacity?: number;
    hoverEffect?: HoverEffectProps;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
    children: React.ReactNode;
} & React.RefAttributes<import("react-native").View | Animated.LegacyRef<import("react-native").View>>>;
export {};
//# sourceMappingURL=PlatformPressable.d.ts.map