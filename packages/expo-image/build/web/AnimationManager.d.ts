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
};
export declare function getAnimatorFromClass(animationClass: string | null): {
    startingClass: string;
    run: (to: React.RefObject<HTMLImageElement>, from: React.RefObject<HTMLImageElement>[]) => void;
} | null;
export default function AnimationManager({ children: renderFunction, initial, animation, }: {
    children: AnimationManagerNode;
    initial: AnimationManagerNode | null;
    animation: null | Animation;
}): JSX.Element;
export {};
//# sourceMappingURL=AnimationManager.d.ts.map