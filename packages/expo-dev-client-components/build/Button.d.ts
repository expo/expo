/// <reference types="react" />
export declare const Button: import("react").ForwardRefExoticComponent<Pick<import("react-native").PressableProps & import("react").RefAttributes<import("react-native").View> & {
    children?: import("react").ReactNode;
} & {
    bg?: "disabled" | "primary" | "secondary" | "tertiary" | "ghost" | "transparent" | undefined;
    border?: "ghost" | undefined;
    shadow?: "button" | undefined;
    rounded?: "small" | "medium" | "large" | "full" | undefined;
    padding?: "small" | "medium" | "large" | "tiny" | undefined;
    px?: "small" | "medium" | "large" | "tiny" | undefined;
    py?: "small" | "medium" | "large" | "tiny" | undefined;
}, keyof import("react-native").PressableProps | "key" | "bg" | "border" | "shadow" | "rounded" | "padding" | "px" | "py"> & import("react").RefAttributes<import("react-native").PressableProps & import("react").RefAttributes<import("react-native").View>>>;
