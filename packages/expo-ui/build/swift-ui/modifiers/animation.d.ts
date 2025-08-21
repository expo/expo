export type TimingAnimation = {
    type: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';
    duration?: number;
};
export type SpringAnimation = {
    type: 'spring';
    response?: number;
    dampingFraction?: number;
    blendDuration?: number;
    duration?: number;
    bounce?: number;
};
export type InterpolatingSpringAnimation = {
    type: 'interpolatingSpring';
    mass?: number;
    stiffness?: number;
    damping?: number;
    initialVelocity?: number;
    duration?: number;
    bounce?: number;
};
export type DefaultAnimation = {
    type: 'default';
};
export type AnimationObject = TimingAnimation | SpringAnimation | InterpolatingSpringAnimation | DefaultAnimation;
export type TimingAnimationParams = {
    duration?: number;
};
export type SpringAnimationParams = {
    response?: number;
    dampingFraction?: number;
    blendDuration?: number;
    duration?: number;
    bounce?: number;
};
export type InterpolatingSpringAnimationParams = {
    duration?: number;
    mass?: number;
    stiffness?: number;
    damping?: number;
    initialVelocity?: number;
    bounce?: number;
};
export declare const Animation: {
    easeInOut: (params?: TimingAnimationParams) => TimingAnimation;
    easeIn: (params?: TimingAnimationParams) => TimingAnimation;
    easeOut: (params?: TimingAnimationParams) => TimingAnimation;
    linear: (params?: TimingAnimationParams) => TimingAnimation;
    spring: (params?: SpringAnimationParams) => SpringAnimation;
    interpolatingSpring: (params?: InterpolatingSpringAnimationParams) => InterpolatingSpringAnimation;
    repeat: (animation: AnimationObject, params: {
        repeatCount: number;
        autoreverses?: boolean;
    }) => {
        repeatCount: number;
        autoreverses: boolean | undefined;
        type: "easeInOut" | "easeIn" | "easeOut" | "linear";
        duration?: number;
    } | {
        repeatCount: number;
        autoreverses: boolean | undefined;
        type: "spring";
        response?: number;
        dampingFraction?: number;
        blendDuration?: number;
        duration?: number;
        bounce?: number;
    } | {
        repeatCount: number;
        autoreverses: boolean | undefined;
        type: "interpolatingSpring";
        mass?: number;
        stiffness?: number;
        damping?: number;
        initialVelocity?: number;
        duration?: number;
        bounce?: number;
    } | {
        repeatCount: number;
        autoreverses: boolean | undefined;
        type: "default";
    };
    delay: (animation: AnimationObject, delay: number) => {
        delay: number;
        type: "easeInOut" | "easeIn" | "easeOut" | "linear";
        duration?: number;
    } | {
        delay: number;
        type: "spring";
        response?: number;
        dampingFraction?: number;
        blendDuration?: number;
        duration?: number;
        bounce?: number;
    } | {
        delay: number;
        type: "interpolatingSpring";
        mass?: number;
        stiffness?: number;
        damping?: number;
        initialVelocity?: number;
        duration?: number;
        bounce?: number;
    } | {
        delay: number;
        type: "default";
    };
    default: DefaultAnimation;
};
export declare const animation: (animationObject: AnimationObject, animatedValue: number | boolean) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=animation.d.ts.map