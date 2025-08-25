import { createModifier } from '../createModifier';
import { VALUE_SYMBOL } from './constants';
export const Animation = {
    // timing animations
    easeInOut: (params) => ChainableAnimation({
        type: 'easeInOut',
        duration: params?.duration,
    }),
    easeIn: (params) => ChainableAnimation({
        type: 'easeIn',
        duration: params?.duration,
    }),
    easeOut: (params) => ChainableAnimation({
        type: 'easeOut',
        duration: params?.duration,
    }),
    linear: (params) => ChainableAnimation({
        type: 'linear',
        duration: params?.duration,
    }),
    // spring animations
    spring: (params) => ChainableAnimation({
        type: 'spring',
        response: params?.response,
        dampingFraction: params?.dampingFraction,
        blendDuration: params?.blendDuration,
        duration: params?.duration,
        bounce: params?.bounce,
    }),
    interpolatingSpring: (params) => ChainableAnimation({
        type: 'interpolatingSpring',
        mass: params?.mass,
        stiffness: params?.stiffness,
        damping: params?.damping,
        initialVelocity: params?.initialVelocity,
        duration: params?.duration,
        bounce: params?.bounce,
    }),
    default: ChainableAnimation({ type: 'default' }),
};
function ChainableAnimation(animation) {
    let _animation = animation;
    return {
        delay: (delay) => {
            _animation = { ..._animation, delay };
            return ChainableAnimation(_animation);
        },
        repeat: (params) => {
            _animation = { ..._animation, ...params };
            return ChainableAnimation(_animation);
        },
        [VALUE_SYMBOL]: () => _animation,
    };
}
export const animation = (animationObject, animatedValue) => {
    return createModifier('animation', { animation: animationObject[VALUE_SYMBOL](), animatedValue });
};
//# sourceMappingURL=index.js.map