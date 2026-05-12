import * as React from 'react';
import { Animated, type ColorValue, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
type HoverEffectProps = {
    color?: ColorValue;
    hoverOpacity?: number;
    activeOpacity?: number;
};
export type Props = Omit<PressableProps, 'style' | 'onPress'> & {
    ref?: React.Ref<React.ComponentRef<typeof AnimatedPressable>>;
    href?: string;
    pressColor?: ColorValue;
    pressOpacity?: number;
    hoverEffect?: HoverEffectProps;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
    children: React.ReactNode;
};
declare const AnimatedPressable: Animated.AnimatedComponent<React.ForwardRefExoticComponent<PressableProps & React.RefAttributes<import("react-native").View>>>;
/**
 * PlatformPressable provides an abstraction on top of Pressable to handle platform differences.
 */
declare function PlatformPressableInternal({ ref, disabled, onPress, onPressIn, onPressOut, android_ripple, pressColor, pressOpacity, hoverEffect, style, children, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export declare const PlatformPressable: typeof PlatformPressableInternal;
export {};
//# sourceMappingURL=PlatformPressable.d.ts.map