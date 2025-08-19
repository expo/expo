import { createModifier } from '.';
export const Animation = {
    easeInOut: (duration) => ({ type: 'easeInOut', duration }),
    easeIn: (duration) => ({ type: 'easeIn', duration }),
    easeOut: (duration) => ({ type: 'easeOut', duration }),
    linear: (duration) => ({ type: 'linear', duration }),
    // spring animations - response/dampingFraction variant
    spring: (response, dampingFraction, blendDuration) => ({
        type: 'spring',
        response,
        dampingFraction,
        blendDuration,
    }),
    // spring animations - duration/bounce variant
    springDuration: (duration, bounce, blendDuration) => ({
        type: 'spring',
        duration,
        bounce,
        blendDuration,
    }),
    // interpolating spring - physics-based variant (mass/stiffness/damping)
    interpolatingSpring: (mass, stiffness, damping, initialVelocity) => ({
        type: 'interpolatingSpring',
        mass,
        stiffness,
        damping,
        initialVelocity,
    }),
    // interpolating spring - duration/bounce variant
    interpolatingSpringDuration: (duration, bounce, initialVelocity) => ({
        type: 'interpolatingSpring',
        duration,
        bounce,
        initialVelocity,
    }),
    default: { type: 'default' },
};
export const animation = (animationObject, animatedValue) => createModifier('animation', { animation: animationObject, animatedValue });
export const withDelay = (animation, delay) => ({ ...animation, delay });
export const withRepeat = (animation, count, autoreverses) => ({
    ...animation,
    repeatCount: count,
    autoreverses,
});
//# sourceMappingURL=animation.js.map