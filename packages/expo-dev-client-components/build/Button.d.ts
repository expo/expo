import * as React from 'react';
import { Animated } from 'react-native';
declare const Container: React.ForwardRefExoticComponent<Pick<Animated.AnimatedProps<import("react-native").PressableProps & React.RefAttributes<import("react-native").View>> & {
    children?: React.ReactNode;
} & {
    margin?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
    mx?: "small" | "medium" | "large" | "micro" | "tiny" | undefined;
    my?: "small" | "medium" | "large" | "micro" | "tiny" | undefined;
    padding?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
    px?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
    py?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
    rounded?: "none" | "small" | "medium" | "large" | "full" | undefined;
    roundedTop?: "none" | "small" | "medium" | "large" | "full" | undefined;
    roundedBottom?: "none" | "small" | "medium" | "large" | "full" | undefined;
    bg?: "transparent" | "primary" | "secondary" | "tertiary" | "ghost" | "default" | "disabled" | undefined;
    border?: "ghost" | undefined;
    shadow?: "button" | undefined;
}, keyof import("react-native").PressableProps | "key" | "bg" | "border" | "shadow" | "margin" | "mx" | "my" | "padding" | "px" | "py" | "rounded" | "roundedTop" | "roundedBottom"> & React.RefAttributes<Animated.AnimatedProps<import("react-native").PressableProps & React.RefAttributes<import("react-native").View>>>>;
export declare const Button: {
    Container: React.ForwardRefExoticComponent<Pick<Animated.AnimatedProps<import("react-native").PressableProps & React.RefAttributes<import("react-native").View>> & {
        children?: React.ReactNode;
    } & {
        margin?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
        mx?: "small" | "medium" | "large" | "micro" | "tiny" | undefined;
        my?: "small" | "medium" | "large" | "micro" | "tiny" | undefined;
        padding?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
        px?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
        py?: "small" | "medium" | "large" | "micro" | "tiny" | "xl" | undefined;
        rounded?: "none" | "small" | "medium" | "large" | "full" | undefined;
        roundedTop?: "none" | "small" | "medium" | "large" | "full" | undefined;
        roundedBottom?: "none" | "small" | "medium" | "large" | "full" | undefined;
        bg?: "transparent" | "primary" | "secondary" | "tertiary" | "ghost" | "default" | "disabled" | undefined;
        border?: "ghost" | undefined;
        shadow?: "button" | undefined;
    }, keyof import("react-native").PressableProps | "key" | "bg" | "border" | "shadow" | "margin" | "mx" | "my" | "padding" | "px" | "py" | "rounded" | "roundedTop" | "roundedBottom"> & React.RefAttributes<Animated.AnimatedProps<import("react-native").PressableProps & React.RefAttributes<import("react-native").View>>>>;
    ScaleOnPressContainer: typeof ScaleOnPressContainer;
    Text: React.ForwardRefExoticComponent<import("react-native").TextProps & {
        children?: React.ReactNode;
    } & {
        color?: "transparent" | "primary" | "secondary" | "tertiary" | "ghost" | "default" | undefined;
        align?: "center" | undefined;
        size?: "small" | "medium" | "large" | undefined;
        leading?: "large" | undefined;
        type?: "mono" | undefined;
        weight?: "normal" | "bold" | "medium" | "thin" | "extralight" | "light" | "semibold" | "extrabold" | "black" | undefined;
    } & React.RefAttributes<import("react-native").TextProps>>;
};
declare type ScalingPressableProps = {
    minScale?: number;
};
declare function ScaleOnPressContainer({ minScale, ...props }: React.ComponentProps<typeof Container> & ScalingPressableProps): JSX.Element;
export {};
//# sourceMappingURL=Button.d.ts.map