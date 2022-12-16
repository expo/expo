// spread and rest parameters can't be used in worklets right now
/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-spread */

/* global _WORKLET */

// @ts-ignore reanimated1/Easing is JS file
import EasingNode from '../reanimated1/Easing';
import { Bezier } from './Bezier';

/**
 * The `Easing` module implements common easing functions. This module is used
 * by [Animate.timing()](docs/animate.html#timing) to convey physically
 * believable motion in animations.
 *
 * You can find a visualization of some common easing functions at
 * http://easings.net/
 *
 * ### Predefined animations
 *
 * The `Easing` module provides several predefined animations through the
 * following methods:
 *
 * - [`back`](docs/easing.html#back) provides a simple animation where the
 *   object goes slightly back before moving forward
 * - [`bounce`](docs/easing.html#bounce) provides a bouncing animation
 * - [`ease`](docs/easing.html#ease) provides a simple inertial animation
 * - [`elastic`](docs/easing.html#elastic) provides a simple spring interaction
 *
 * ### Standard functions
 *
 * Three standard easing functions are provided:
 *
 * - [`linear`](docs/easing.html#linear)
 * - [`quad`](docs/easing.html#quad)
 * - [`cubic`](docs/easing.html#cubic)
 *
 * The [`poly`](docs/easing.html#poly) function can be used to implement
 * quartic, quintic, and other higher power functions.
 *
 * ### Additional functions
 *
 * Additional mathematical functions are provided by the following methods:
 *
 * - [`bezier`](docs/easing.html#bezier) provides a cubic bezier curve
 * - [`circle`](docs/easing.html#circle) provides a circular function
 * - [`sin`](docs/easing.html#sin) provides a sinusoidal function
 * - [`exp`](docs/easing.html#exp) provides an exponential function
 *
 * The following helpers are used to modify other easing functions.
 *
 * - [`in`](docs/easing.html#in) runs an easing function forwards
 * - [`inOut`](docs/easing.html#inout) makes any easing function symmetrical
 * - [`out`](docs/easing.html#out) runs an easing function backwards
 */

export type EasingFn = (t: number) => number;

export type EasingFactoryFn = { factory: () => EasingFn };
/**
 * A linear function, `f(t) = t`. Position correlates to elapsed time one to
 * one.
 *
 * http://cubic-bezier.com/#0,0,1,1
 */
function linear(t: number): number {
  'worklet';
  return t;
}

/**
 * A simple inertial interaction, similar to an object slowly accelerating to
 * speed.
 *
 * http://cubic-bezier.com/#.42,0,1,1
 */
function ease(t: number): number {
  'worklet';
  return Bezier(0.42, 0, 1, 1)(t);
}

/**
 * A quadratic function, `f(t) = t * t`. Position equals the square of elapsed
 * time.
 *
 * http://easings.net/#easeInQuad
 */
function quad(t: number): number {
  'worklet';
  return t * t;
}

/**
 * A cubic function, `f(t) = t * t * t`. Position equals the cube of elapsed
 * time.
 *
 * http://easings.net/#easeInCubic
 */
function cubic(t: number): number {
  'worklet';
  return t * t * t;
}

/**
 * A power function. Position is equal to the Nth power of elapsed time.
 *
 * n = 4: http://easings.net/#easeInQuart
 * n = 5: http://easings.net/#easeInQuint
 */
function poly(n: number): EasingFn {
  'worklet';
  return (t) => {
    'worklet';
    return Math.pow(t, n);
  };
}

/**
 * A sinusoidal function.
 *
 * http://easings.net/#easeInSine
 */
function sin(t: number): number {
  'worklet';
  return 1 - Math.cos((t * Math.PI) / 2);
}

/**
 * A circular function.
 *
 * http://easings.net/#easeInCirc
 */
function circle(t: number): number {
  'worklet';
  return 1 - Math.sqrt(1 - t * t);
}

/**
 * An exponential function.
 *
 * http://easings.net/#easeInExpo
 */
function exp(t: number): number {
  'worklet';
  return Math.pow(2, 10 * (t - 1));
}

/**
 * A simple elastic interaction, similar to a spring oscillating back and
 * forth.
 *
 * Default bounciness is 1, which overshoots a little bit once. 0 bounciness
 * doesn't overshoot at all, and bounciness of N > 1 will overshoot about N
 * times.
 *
 * http://easings.net/#easeInElastic
 */
function elastic(bounciness = 1): EasingFn {
  'worklet';
  const p = bounciness * Math.PI;
  return (t) => {
    'worklet';
    return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
  };
}

/**
 * Use with `Animated.parallel()` to create a simple effect where the object
 * animates back slightly as the animation starts.
 *
 * Wolfram Plot:
 *
 * - http://tiny.cc/back_default (s = 1.70158, default)
 */
function back(s = 1.70158): (t: number) => number {
  'worklet';
  return (t) => {
    'worklet';
    return t * t * ((s + 1) * t - s);
  };
}

/**
 * Provides a simple bouncing effect.
 *
 * http://easings.net/#easeInBounce
 */
function bounce(t: number): number {
  'worklet';
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  }

  if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75;
    return 7.5625 * t2 * t2 + 0.75;
  }

  if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75;
    return 7.5625 * t2 * t2 + 0.9375;
  }

  const t2 = t - 2.625 / 2.75;
  return 7.5625 * t2 * t2 + 0.984375;
}

/**
 * Provides a cubic bezier curve, equivalent to CSS Transitions'
 * `transition-timing-function`.
 *
 * A useful tool to visualize cubic bezier curves can be found at
 * http://cubic-bezier.com/
 */
function bezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { factory: () => (x: number) => number } {
  'worklet';
  return {
    factory: () => {
      'worklet';
      return Bezier(x1, y1, x2, y2);
    },
  };
}

function bezierFn(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (x: number) => number {
  'worklet';
  return Bezier(x1, y1, x2, y2);
}

/**
 * Runs an easing function forwards.
 */
function in_(easing: EasingFn): EasingFn {
  'worklet';
  return easing;
}

/**
 * Runs an easing function backwards.
 */
function out(easing: EasingFn): EasingFn {
  'worklet';
  return (t) => {
    'worklet';
    return 1 - easing(1 - t);
  };
}

/**
 * Makes any easing function symmetrical. The easing function will run
 * forwards for half of the duration, then backwards for the rest of the
 * duration.
 */
function inOut(easing: EasingFn): EasingFn {
  'worklet';
  return (t) => {
    'worklet';
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  };
}

const EasingObject = {
  linear,
  ease,
  quad,
  cubic,
  poly,
  sin,
  circle,
  exp,
  elastic,
  back,
  bounce,
  bezier,
  bezierFn,
  in: in_,
  out,
  inOut,
};

// TODO type worklets
function createChecker(
  worklet: any,
  workletName: string,
  prevArgs?: unknown
): any {
  /* should return Animated.Value or worklet */
  function checkIfReaOne(): any {
    'worklet';
    if (arguments && !_WORKLET) {
      for (let i = 0; i < arguments.length; i++) {
        const arg = arguments[i];
        if (arg && arg.__nodeID) {
          console.warn(
            `Easing was renamed to EasingNode in Reanimated 2. Please use EasingNode instead`
          );
          if (prevArgs) {
            return EasingNode[workletName]
              .apply(undefined, prevArgs)
              .apply(undefined, arguments);
          }
          return EasingNode[workletName].apply(undefined, arguments);
        }
      }
    }
    // @ts-ignore this is implicitly any - TODO
    const res = worklet.apply(this, arguments);
    if (!_WORKLET && res && typeof res === 'function' && res.__workletHash) {
      return createChecker(res, workletName, arguments);
    }
    return res;
  }
  // use original worklet on UI side
  checkIfReaOne._closure = worklet._closure;
  checkIfReaOne.asString = worklet.asString;
  checkIfReaOne.__workletHash = worklet.__workletHash;
  checkIfReaOne.__location = worklet.__location;
  return checkIfReaOne;
}

type EasingObjT = Array<keyof typeof EasingObject>;
(Object.keys(EasingObject) as EasingObjT).forEach((key) => {
  EasingObject[key] = createChecker(EasingObject[key], key);
});

export const Easing = EasingObject;
