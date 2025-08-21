import { createModifier } from './createModifier';
export const Animation = {
    // timing animations
    easeInOut: (params) => ({
        type: 'easeInOut',
        duration: params?.duration,
    }),
    easeIn: (params) => ({
        type: 'easeIn',
        duration: params?.duration,
    }),
    easeOut: (params) => ({
        type: 'easeOut',
        duration: params?.duration,
    }),
    linear: (params) => ({
        type: 'linear',
        duration: params?.duration,
    }),
    // spring animations
    spring: (params) => ({
        type: 'spring',
        response: params?.response,
        dampingFraction: params?.dampingFraction,
        blendDuration: params?.blendDuration,
        duration: params?.duration,
        bounce: params?.bounce,
    }),
    interpolatingSpring: (params) => ({
        type: 'interpolatingSpring',
        mass: params?.mass,
        stiffness: params?.stiffness,
        damping: params?.damping,
        initialVelocity: params?.initialVelocity,
        duration: params?.duration,
        bounce: params?.bounce,
    }),
    // animation modifiers
    repeat: (animation, params) => ({
        ...animation,
        repeatCount: params.repeatCount,
        autoreverses: params.autoreverses,
    }),
    delay: (animation, delay) => ({
        ...animation,
        delay,
    }),
    default: { type: 'default' },
};
export const animation = (animationObject, animatedValue) => createModifier('animation', { animation: animationObject, animatedValue });
//# sourceMappingURL=animation.js.map