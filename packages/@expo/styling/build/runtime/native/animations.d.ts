import React, { ComponentType } from "react";
import { AnimatableValue } from "react-native-reanimated";
import { AnimatableCSSProperty, ContainerRuntime, Interaction, InteropMeta, Style } from "../../types";
type AnimationInteropProps = Record<string, unknown> & {
    __component: ComponentType<any>;
    __interaction: Interaction;
    __variables: Record<string, unknown>;
    __containers: Record<string, ContainerRuntime>;
    __interopMeta: InteropMeta;
};
export declare const AnimationInterop: React.ForwardRefExoticComponent<Pick<AnimationInteropProps, string> & React.RefAttributes<unknown>>;
export declare const defaultValues: {
    [K in AnimatableCSSProperty]?: Style[K];
};
export declare const defaultTransform: Record<string, AnimatableValue>;
export declare const transformProps: Set<string>;
export declare const defaultTransformEntries: {
    [x: string]: AnimatableValue;
}[];
export {};
//# sourceMappingURL=animations.d.ts.map