import { AnimationObject, ChainableAnimationType, InterpolatingSpringAnimationParams, SpringAnimationParams, TimingAnimationParams } from './types';
export declare const Animation: {
    easeInOut: (params?: TimingAnimationParams) => ChainableAnimationType;
    easeIn: (params?: TimingAnimationParams) => ChainableAnimationType;
    easeOut: (params?: TimingAnimationParams) => ChainableAnimationType;
    linear: (params?: TimingAnimationParams) => ChainableAnimationType;
    spring: (params?: SpringAnimationParams) => ChainableAnimationType;
    interpolatingSpring: (params?: InterpolatingSpringAnimationParams) => ChainableAnimationType;
    default: ChainableAnimationType;
};
declare function ChainableAnimation(animation: AnimationObject): ChainableAnimationType;
export declare const animation: (animationObject: ReturnType<typeof ChainableAnimation>, animatedValue: number | boolean) => import("../createModifier").ModifierConfig;
export {};
//# sourceMappingURL=index.d.ts.map