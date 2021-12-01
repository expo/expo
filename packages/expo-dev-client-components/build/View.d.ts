/// <reference types="react" />
export declare const View: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    children?: import("react").ReactNode;
} & {
    margin?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    mx?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    my?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    padding?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    px?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    py?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    flex?: "1" | "0" | undefined;
    shrink?: "1" | "0" | undefined;
    bg?: "secondary" | "error" | "warning" | "success" | "default" | undefined;
    border?: "default" | undefined;
    rounded?: "small" | "medium" | "large" | "full" | undefined;
    shadow?: "button" | "small" | "medium" | "tiny" | "micro" | undefined;
    width?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    height?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
} & import("react").RefAttributes<import("react-native").ViewProps>>;
export declare const Row: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    children?: import("react").ReactNode;
} & {
    margin?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    mx?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    my?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    padding?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    px?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    py?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    align?: "center" | "start" | "end" | undefined;
} & import("react").RefAttributes<import("react-native").ViewProps>>;
export declare const Spacer: {
    Vertical: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
        children?: import("react").ReactNode;
    } & {
        size?: "small" | "medium" | "large" | "tiny" | "flex" | "micro" | undefined;
    } & import("react").RefAttributes<import("react-native").ViewProps>>;
    Horizontal: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
        children?: import("react").ReactNode;
    } & {
        size?: "small" | "medium" | "large" | "tiny" | "flex" | "micro" | undefined;
    } & import("react").RefAttributes<import("react-native").ViewProps>>;
};
export declare const Divider: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    children?: import("react").ReactNode;
} & {
    margin?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    mx?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    my?: "small" | "medium" | "large" | "tiny" | "micro" | undefined;
    weight?: "normal" | "thin" | "heavy" | undefined;
} & import("react").RefAttributes<import("react-native").ViewProps>>;
export declare const StatusIndicator: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    children?: import("react").ReactNode;
} & {
    status?: "error" | "warning" | "success" | "default" | "info" | undefined;
    size?: "small" | "medium" | undefined;
} & import("react").RefAttributes<import("react-native").ViewProps>>;
