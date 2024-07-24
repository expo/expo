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
    timingFunction: "ease-in-out" | "ease-in" | "ease-out" | "linear" | null;
    animationClass: "cross-dissolve" | "flip-from-top" | "flip-from-right" | "flip-from-bottom" | "flip-from-left" | "curl-up" | "curl-down";
    duration: number;
} | null;
export default function AnimationManager({ children: renderFunction, initial, transition, recyclingKey, }: {
    children: AnimationManagerNode;
    initial: AnimationManagerNode | null;
    transition: ImageTransition | null | undefined;
    recyclingKey?: string | null | undefined;
}): JSX.Element;
export {};
//# sourceMappingURL=AnimationManager.d.ts.map