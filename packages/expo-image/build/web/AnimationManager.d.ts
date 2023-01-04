import React from 'react';
type AnimationManagerNode = [
    key: string,
    renderFunction: (callbacks: {
        onReady: () => void;
        onAnimationFinished: () => void;
        onMount: () => void;
        ref: React.RefObject<HTMLImageElement>;
    }) => React.ReactElement
];
type Animation = null | {
    run: (to: React.RefObject<HTMLImageElement>, from: React.RefObject<HTMLImageElement>[]) => void;
    startingClass: string;
    containerClass: string;
    timingFunction: string | null;
    animationClass: string | null;
};
export declare function getAnimatorFromClass(animationClass: string | null, timingFunction: string | null): {
    startingClass: string;
    run: (to: React.RefObject<HTMLImageElement>, from: React.RefObject<HTMLImageElement>[]) => void;
    containerClass: string;
    timingFunction: string | null;
    animationClass: string;
} | null;
export default function AnimationManager({ children: renderFunction, initial, animation, }: {
    children: AnimationManagerNode;
    initial: AnimationManagerNode | null;
    animation: null | Animation;
}): JSX.Element;
export {};
//# sourceMappingURL=AnimationManager.d.ts.map