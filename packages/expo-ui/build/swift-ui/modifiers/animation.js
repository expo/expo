import { createModifier } from '.';
export const Animation = {
    easeInOut: (duration) => ({ type: 'easeInOut', duration }),
    easeIn: (duration) => ({ type: 'easeIn', duration }),
    easeOut: (duration) => ({ type: 'easeOut', duration }),
    linear: (duration) => ({ type: 'linear', duration }),
    spring: (response, dampingFraction, blendDuration) => ({
        type: 'spring',
        response,
        dampingFraction,
        blendDuration,
    }),
    interpolatingSpring: (mass, stiffness, damping, initialVelocity) => ({
        type: 'interpolatingSpring',
        mass,
        stiffness,
        damping,
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