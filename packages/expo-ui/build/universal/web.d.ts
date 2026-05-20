import type { ComponentProps, ElementType } from 'react';
import { type ImageStyle, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
type Simplify<T> = {
    [K in keyof T]: T[K];
};
type Merge<A, B> = Simplify<Omit<A, keyof B> & B>;
type Style = StyleProp<ImageStyle | TextStyle | ViewStyle>;
export declare const createWebComponent: <T extends ElementType>(type: T) => (props: Merge<ComponentProps<T>, {
    style?: Style;
}>) => import("react").ReactElement<Simplify<Omit<ComponentProps<T>, "style"> & {
    style?: Style;
}>, string | import("react").JSXElementConstructor<any>>;
export {};
//# sourceMappingURL=web.d.ts.map