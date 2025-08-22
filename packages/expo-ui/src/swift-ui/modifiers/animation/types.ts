import { VALUE_SYMBOL } from './constants';

/**
 * Animation object that is passed to native.
 * @hidden
 */
export type AnimationObject = {
  type:
    | 'easeInOut'
    | 'easeIn'
    | 'easeOut'
    | 'linear'
    | 'spring'
    | 'interpolatingSpring'
    | 'default';
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

export type ChainableAnimationType = {
  delay: (delay: number) => ChainableAnimationType;
  repeat: (params: { repeatCount: number; autoreverses?: boolean }) => ChainableAnimationType;
  [VALUE_SYMBOL]: () => AnimationObject;
};
