import { createModifier } from './createModifier';

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

export type AnimationObject =
  | TimingAnimation
  | SpringAnimation
  | InterpolatingSpringAnimation
  | DefaultAnimation;

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

export const Animation = {
  // timing animations
  easeInOut: (params?: TimingAnimationParams): TimingAnimation => ({
    type: 'easeInOut',
    duration: params?.duration,
  }),
  easeIn: (params?: TimingAnimationParams): TimingAnimation => ({
    type: 'easeIn',
    duration: params?.duration,
  }),
  easeOut: (params?: TimingAnimationParams): TimingAnimation => ({
    type: 'easeOut',
    duration: params?.duration,
  }),
  linear: (params?: TimingAnimationParams): TimingAnimation => ({
    type: 'linear',
    duration: params?.duration,
  }),

  // spring animations
  spring: (params?: SpringAnimationParams): SpringAnimation => ({
    type: 'spring',
    response: params?.response,
    dampingFraction: params?.dampingFraction,
    blendDuration: params?.blendDuration,
    duration: params?.duration,
    bounce: params?.bounce,
  }),
  interpolatingSpring: (
    params?: InterpolatingSpringAnimationParams
  ): InterpolatingSpringAnimation => ({
    type: 'interpolatingSpring',
    mass: params?.mass,
    stiffness: params?.stiffness,
    damping: params?.damping,
    initialVelocity: params?.initialVelocity,
    duration: params?.duration,
    bounce: params?.bounce,
  }),

  // animation modifiers
  repeat: (
    animation: AnimationObject,
    params: {
      repeatCount: number;
      autoreverses?: boolean;
    }
  ) => ({
    ...animation,
    repeatCount: params.repeatCount,
    autoreverses: params.autoreverses,
  }),
  delay: (animation: AnimationObject, delay: number) => ({
    ...animation,
    delay,
  }),

  default: { type: 'default' } as DefaultAnimation,
};

export const animation = (animationObject: AnimationObject, animatedValue: number | boolean) =>
  createModifier('animation', { animation: animationObject, animatedValue });
