import { createModifier } from '.';

export type TimingAnimation = {
  type: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';
  duration?: number;
};

export type SpringAnimation = {
  type: 'spring';
  response?: number;
  dampingFraction?: number;
  blendDuration?: number;
};

export type InterpolatingSpringAnimation = {
  type: 'interpolatingSpring';
  mass?: number;
  stiffness?: number;
  damping?: number;
  initialVelocity?: number;
};

export type DefaultAnimation = {
  type: 'default';
};

export type AnimationObject =
  | TimingAnimation
  | SpringAnimation
  | InterpolatingSpringAnimation
  | DefaultAnimation;

export const Animation = {
  easeInOut: (duration?: number): TimingAnimation => ({ type: 'easeInOut', duration }),
  easeIn: (duration?: number): TimingAnimation => ({ type: 'easeIn', duration }),
  easeOut: (duration?: number): TimingAnimation => ({ type: 'easeOut', duration }),
  linear: (duration?: number): TimingAnimation => ({ type: 'linear', duration }),

  spring: (
    response?: number,
    dampingFraction?: number,
    blendDuration?: number
  ): SpringAnimation => ({
    type: 'spring',
    response,
    dampingFraction,
    blendDuration,
  }),

  interpolatingSpring: (
    mass?: number,
    stiffness?: number,
    damping?: number,
    initialVelocity?: number
  ): InterpolatingSpringAnimation => ({
    type: 'interpolatingSpring',
    mass,
    stiffness,
    damping,
    initialVelocity,
  }),

  default: { type: 'default' } as DefaultAnimation,
};

export const animation = (animationObject: AnimationObject, animatedValue: number | boolean) =>
  createModifier('animation', { animation: animationObject, animatedValue });

export const withDelay = <T extends AnimationObject>(
  animation: T,
  delay: number
): T & { delay: number } => ({ ...animation, delay });

export const withRepeat = <T extends AnimationObject>(
  animation: T,
  count: number,
  autoreverses?: boolean
): T & { repeatCount: number; autoreverses?: boolean } => ({
  ...animation,
  repeatCount: count,
  autoreverses,
});
