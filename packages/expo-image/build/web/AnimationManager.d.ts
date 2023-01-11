import React from 'react';
import { ImageTransition } from '../Image.types';
type Callbacks = {
    onReady?: ((event: React.SyntheticEvent<HTMLImageElement, Event>) => void) | null;
    onAnimationFinished?: ((forceUnmount?: boolean) => void) | null;
    onMount?: (() => void) | null;
};
type AnimationManagerNode = [
    key: string,
    renderFunction: (renderProps: NonNullable<Callbacks>) => (className: string) => React.ReactElement
];
type Animation = null | {
    animateInClass: string;
    animateOutClass: string;
    startingClass: string;
    containerClass: string;
    timingFunction: ImageTransition['timing'];
    animationClass: ImageTransition['effect'];
};
export declare function getAnimatorFromClass(animationClass: ImageTransition['effect'], timingFunction: ImageTransition['timing']): {
    startingClass: string;
    animateInClass: string;
    animateOutClass: string;
    containerClass: string;
    timingFunction: "ease-in-out" | "ease-in" | "ease-out" | "linear" | undefined;
    animationClass: "cross-dissolve" | "flip-from-top" | "flip-from-right" | "flip-from-bottom" | "flip-from-left" | "curl-up" | "curl-down";
} | null;
export default function AnimationManager({ children: renderFunction, initial, animation, }: {
    children: AnimationManagerNode;
    initial: AnimationManagerNode | null;
    animation: null | Animation;
}): JSX.Element;
export {};
//# sourceMappingURL=AnimationManager.d.ts.map