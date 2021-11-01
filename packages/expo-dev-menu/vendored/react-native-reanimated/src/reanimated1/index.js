import EasingNode from './Easing';
import AnimatedClock from './core/AnimatedClock';
import AnimatedValue from './core/AnimatedValue';
import AnimatedNode from './core/AnimatedNode';
import AnimatedCode from './core/AnimatedCode';
import decay from './animations/decay';
import timing from './animations/timing';
import spring from './animations/spring';
import Animation from './animations/Animation';
import {
  Transition,
  Transitioning,
  createTransitioningComponent,
} from './Transitioning';
import SpringUtils from './animations/SpringUtils';
import useValue from './useValue';
import backwardCompatibleAnimWrapper from './animations/backwardCompatibleAnimWrapper';

const decayWrapper = backwardCompatibleAnimWrapper(
  decay,
  Animation.decayDefaultState
);
const timingWrapper = backwardCompatibleAnimWrapper(
  timing,
  Animation.timingDefaultState
);
const springWrapper = backwardCompatibleAnimWrapper(
  spring,
  Animation.springDefaultState
);

// operations
export * from './base';
export * from './derived';
export {
  AnimatedCode as Code,
  // transitions
  EasingNode,
  Transitioning,
  Transition,
  createTransitioningComponent,
  // nodes
  AnimatedClock as Clock,
  AnimatedValue as Value,
  AnimatedNode as Node,
  // animations
  decayWrapper as decay,
  timingWrapper as timing,
  springWrapper as spring,
  SpringUtils,
  // hooks
  useValue,
};
