import { createModifier } from '../createModifier';
import { VALUE_SYMBOL } from './constants';
import {
  AnimationObject,
  ChainableAnimationType,
  InterpolatingSpringAnimationParams,
  SpringAnimationParams,
  TimingAnimationParams,
} from './types';

export const Animation = {
  // timing animations
  easeInOut: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'easeInOut',
      duration: params?.duration,
    }),
  easeIn: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'easeIn',
      duration: params?.duration,
    }),
  easeOut: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'easeOut',
      duration: params?.duration,
    }),
  linear: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'linear',
      duration: params?.duration,
    }),

  // spring animations
  spring: (params?: SpringAnimationParams) =>
    ChainableAnimation({
      type: 'spring',
      response: params?.response,
      dampingFraction: params?.dampingFraction,
      blendDuration: params?.blendDuration,
      duration: params?.duration,
      bounce: params?.bounce,
    }),
  interpolatingSpring: (params?: InterpolatingSpringAnimationParams) =>
    ChainableAnimation({
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

function ChainableAnimation(animation: AnimationObject): ChainableAnimationType {
  let _animation: AnimationObject = animation;

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

export const animation = (
  animationObject: ReturnType<typeof ChainableAnimation>,
  animatedValue: number | boolean
) => {
  return createModifier('animation', { animation: animationObject[VALUE_SYMBOL](), animatedValue });
};
