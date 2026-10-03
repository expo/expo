import { VALUE_SYMBOL } from './constants';
/**
 * Animation object that is passed to native.
 * @hidden
 */
export type AnimationObject = {
    type: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear' | 'spring' | 'interpolatingSpring' | 'smooth' | 'snappy' | 'bouncy' | 'default';
    duration?: number;
    response?: number;
    dampingFraction?: number;
    blendDuration?: number;
    bounce?: number;
    mass?: number;
    stiffness?: number;
    damping?: number;
    initialVelocity?: number;
    extraBounce?: number;
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
export type SpringPresetAnimationParams = {
    /**
     * The perceptual duration, which defines the pace of the spring (in seconds). This is
     * approximately equal to the settling duration, but for very bouncy springs, it is the period of
     * oscillation of the spring.
     */
    duration?: number;
    /**
     * Bounce added to the base bounce of the preset: 0 for `smooth`, 0.15 for `snappy`, and 0.3 for
     * `bouncy`. Keep the total below 1: at 1 and above, the spring oscillates without settling.
     */
    extraBounce?: number;
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