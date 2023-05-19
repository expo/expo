/// <reference types="react" />
import { Dimensions, Appearance } from 'react-native';
import { ContainerRuntime, ExtractedAnimation, StyleMeta, StyleProp } from '../../types';
export declare const globalStyles: Map<string, StyleProp>;
export declare const styleMetaMap: WeakMap<NonNullable<StyleProp> | NonNullable<StyleProp>[], StyleMeta>;
export declare const animationMap: Map<string, ExtractedAnimation>;
export declare const rem: {
    get: () => number;
    set: (nextValue: number) => void;
    reset: () => void;
};
export declare const vw: {
    get: () => number;
    reset: (dimensions: Dimensions) => void;
    __set: (value: number) => void;
};
export declare const vh: {
    get: () => number;
    reset: (dimensions: Dimensions) => void;
    __set: (value: number) => void;
};
export declare const colorScheme: {
    get: () => "light" | "dark";
    set: (colorScheme: 'light' | 'dark' | 'system') => void;
    reset: (appearance: typeof Appearance) => void;
};
export declare const isReduceMotionEnabled: {
    reset: () => void;
    get(): boolean;
    snapshot(): boolean;
    set(value: boolean): void;
    stale(change: 1 | -1, fresh: boolean): void;
    subscribe(callback: () => void): () => void;
};
export declare const VariableContext: import("react").Context<Record<string, any>>;
export declare const ContainerContext: import("react").Context<Record<string, ContainerRuntime>>;
//# sourceMappingURL=globals.d.ts.map