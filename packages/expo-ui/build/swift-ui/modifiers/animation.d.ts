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
export declare const Animation: {
    easeInOut: (duration?: number) => TimingAnimation;
    easeIn: (duration?: number) => TimingAnimation;
    easeOut: (duration?: number) => TimingAnimation;
    linear: (duration?: number) => TimingAnimation;
    spring: (response?: number, dampingFraction?: number, blendDuration?: number) => SpringAnimation;
    springDuration: (duration?: number, bounce?: number, blendDuration?: number) => SpringAnimation;
    interpolatingSpring: (mass?: number, stiffness?: number, damping?: number, initialVelocity?: number) => InterpolatingSpringAnimation;
    interpolatingSpringDuration: (duration?: number, bounce?: number, initialVelocity?: number) => InterpolatingSpringAnimation;
    default: DefaultAnimation;
};
export declare const animation: (animationObject: AnimationObject, animatedValue: number | boolean) => import(".").ModifierConfig;
export declare const withDelay: <T extends AnimationObject>(animation: T, delay: number) => T & {
    delay: number;
};
export declare const withRepeat: <T extends AnimationObject>(animation: T, count: number, autoreverses?: boolean) => T & {
    repeatCount: number;
    autoreverses?: boolean;
};
//# sourceMappingURL=animation.d.ts.map