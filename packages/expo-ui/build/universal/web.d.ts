import type { ComponentProps, ElementType } from 'react';
import { type ImageStyle, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
type Simplify<T> = {
    [K in keyof T]: T[K];
};
type Merge<A, B> = Simplify<Omit<A, keyof B> & B>;
type Style = StyleProp<ImageStyle | TextStyle | ViewStyle>;
export declare const createWebComponent: <T extends ElementType>(type: T) => (props: Merge<ComponentProps<T>, {
    focusable?: boolean;
    style?: Style;
    testID?: string;
}>) => import("react").ReactElement<Simplify<Omit<ComponentProps<T>, "style" | "focusable" | "testID"> & {
    focusable?: boolean;
    style?: Style;
    testID?: string;
}>, string | import("react").JSXElementConstructor<any>>;
export declare const css: (strings: TemplateStringsArray, ...values: unknown[]) => string;
export declare const colors: {
    background: string;
    red: string;
    primary: {
        foreground: string;
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
    gray: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
};
export declare const durations: {
    fast: string;
    base: string;
    slow: string;
};
export declare const easings: {
    standard: string;
};
export declare const shadows: {
    button: string;
    focus: string;
};
export declare const globalCss: string;
export {};
//# sourceMappingURL=web.d.ts.map