import React from 'react';
import { ImageTransition } from '../Image.types';
type Callbacks = {
    onReady?: (() => void) | null;
    onAnimationFinished?: (() => void) | null;
    onMount?: (() => void) | null;
    onError?: (() => void) | null;
};
export type AnimationManagerNode = [
    key: string,
    renderFunction: (renderProps: NonNullable<Callbacks>) => (className: string, style: React.CSSProperties) => React.ReactElement
];
export declare function getAnimatorFromTransition(transition: ImageTransition | null | undefined): {
    startingClass: string;
    animateInClass: string;
    animateOutClass: string;
    containerClass: string;
    timingFunction: string;
    animationClass: string;
    duration: number;
} | {
    startingClass: string;
    animateInClass: string;
    animateOutClass: string;
    containerClass: string;
    timingFunction: "linear" | "ease-in-out" | "ease-in" | "ease-out" | null;
    animationClass: "cross-dissolve" | "flip-from-top" | "flip-from-right" | "flip-from-bottom" | "flip-from-left" | "curl-up" | "curl-down" | "sf:bounce" | "sf:bounce/up" | "sf:bounce/down" | "sf:bounce/by-layer" | "sf:bounce/whole-symbol" | "sf:pulse" | "sf:pulse/by-layer" | "sf:pulse/whole-symbol" | "sf:variable-color" | "sf:variable-color/iterative" | "sf:variable-color/cumulative" | "sf:scale" | "sf:scale/up" | "sf:scale/down" | "sf:scale/by-layer" | "sf:scale/whole-symbol" | "sf:appear" | "sf:appear/by-layer" | "sf:appear/whole-symbol" | "sf:disappear" | "sf:disappear/by-layer" | "sf:disappear/whole-symbol" | "sf:replace" | "sf:wiggle" | "sf:wiggle/by-layer" | "sf:wiggle/whole-symbol" | "sf:rotate" | "sf:rotate/by-layer" | "sf:rotate/whole-symbol" | "sf:breathe" | "sf:breathe/by-layer" | "sf:breathe/whole-symbol" | "sf:draw-on";
    duration: number;
} | null;
export default function AnimationManager({ children: renderFunction, initial, transition, recyclingKey, }: {
    children: AnimationManagerNode;
    initial: AnimationManagerNode | null;
    transition: ImageTransition | null | undefined;
    recyclingKey?: string | null | undefined;
}): React.JSX.Element;
export {};
//# sourceMappingURL=AnimationManager.d.ts.map