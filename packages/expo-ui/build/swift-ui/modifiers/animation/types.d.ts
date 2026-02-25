import { VALUE_SYMBOL } from './constants';
/**
 * Animation object that is passed to native.
 * @hidden
 */
export type AnimationObject = {
    type: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear' | 'spring' | 'interpolatingSpring' | 'default';
    duration?: number;
    response?: number;
    dampingFraction?: number;
    blendDuration?: number;
    bounce?: number;
    mass?: number;
    stiffness?: number;
    damping?: number;
    initialVelocity?: number;
    delay?: number;
    repeatCount?: number;
    autoreverses?: boolean;
};
export type TimingAnimationParams = {
    /**
     * Total animation duration (in seconds).
     */
    duration?: number;
};
export type SpringAnimationParams = {
    /**
     * The spring's response time (in seconds).
     */
    response?: number;
    /**
     * The amount of damping applied to the spring's motion.
     */
    dampingFraction?: number;
    /**
     * The duration over which to blend between animations (in seconds).
     */
    blendDuration?: number;
    /**
     * Total animation duration (in seconds).
     */
    duration?: number;
    /**
     * Extra bounce to apply to the spring animation.
     */
    bounce?: number;
};
export type InterpolatingSpringAnimationParams = {
    /**
     * Total animation duration (in seconds).
     */
    duration?: number;
    /**
     * The mass attached to the spring.
     */
    mass?: number;
    /**
     * The stiffness of the spring.
     */
    stiffness?: number;
    /**
     * The damping applied to the spring.
     */
    damping?: number;
    /**
     * The initial velocity of the animation.
     */
    initialVelocity?: number;
    /**
     * Extra bounce to apply to the spring animation.
     */
    bounce?: number;
};
export type ChainableAnimationType = {
    /** Adds a delay before the animation starts (in seconds). */
    delay: (delay: number) => ChainableAnimationType;
    /** Repeats the animation the given number of times. */
    repeat: (params: {
        repeatCount: number;
        autoreverses?: boolean;
    }) => ChainableAnimationType;
    [VALUE_SYMBOL]: () => AnimationObject;
};
//# sourceMappingURL=types.d.ts.map