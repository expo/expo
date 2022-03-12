import * as React from 'react';
import { ViewStyle, ImageStyle, TextStyle } from 'react-native';
declare type StyleType = ViewStyle | TextStyle | ImageStyle;
declare type Options = {
    base?: StyleType;
    variants?: VariantMap<StyleType>;
};
declare type VariantMap<T> = {
    [key: string]: {
        [key: string]: T;
    };
};
declare type Nested<Type> = {
    [Property in keyof Type]?: keyof Type[Property];
};
declare type SelectorMap<Variants> = Partial<{
    [K in keyof Variants]?: {
        [T in keyof Variants[K]]?: StyleType;
    };
}>;
declare type Selectors<Variants> = {
    light?: SelectorMap<Variants>;
    dark?: SelectorMap<Variants>;
};
export declare function create<T, O extends Options>(component: React.ComponentType<T>, config: O & {
    selectors?: Selectors<O['variants']>;
    props?: T;
}): React.ForwardRefExoticComponent<React.PropsWithoutRef<T & {
    children?: React.ReactNode;
} & Nested<(O & {
    selectors?: Selectors<O["variants"]> | undefined;
    props?: T | undefined;
})["variants"]>> & React.RefAttributes<T>>;
export {};
//# sourceMappingURL=create-primitive.d.ts.map