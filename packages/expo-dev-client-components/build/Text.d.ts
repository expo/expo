/// <reference types="react" />
export declare const Heading: import("react").ForwardRefExoticComponent<import("react-native").TextProps & {
    children?: import("react").ReactNode;
} & {
    size?: "small" | "medium" | "large" | undefined;
    weight?: "medium" | "normal" | "bold" | "thin" | "extralight" | "light" | "semibold" | "extrabold" | "black" | undefined;
    color?: "primary" | "secondary" | "error" | "warning" | "success" | undefined;
} & import("react").RefAttributes<import("react-native").TextProps>>;
export declare const Text: import("react").ForwardRefExoticComponent<import("react-native").TextProps & {
    children?: import("react").ReactNode;
} & {
    align?: "center" | undefined;
    size?: "small" | "medium" | "large" | undefined;
    leading?: "large" | undefined;
    type?: "mono" | undefined;
    weight?: "medium" | "normal" | "bold" | "thin" | "extralight" | "light" | "semibold" | "extrabold" | "black" | undefined;
    color?: "primary" | "secondary" | "error" | undefined;
    button?: "primary" | "secondary" | "tertiary" | "ghost" | "transparent" | undefined;
} & import("react").RefAttributes<import("react-native").TextProps>>;
export declare const TextInput: import("react").ForwardRefExoticComponent<import("react-native").TextInputProps & {
    children?: import("react").ReactNode;
} & {
    size?: "small" | "medium" | "large" | undefined;
    type?: "mono" | undefined;
    weight?: "medium" | "normal" | "bold" | "thin" | "extralight" | "light" | "semibold" | "extrabold" | "black" | undefined;
    color?: "secondary" | "error" | "warning" | "success" | undefined;
} & import("react").RefAttributes<import("react-native").TextInputProps>>;
