import {
  cond,
  lessThan,
  multiply,
  pow,
  cos,
  sqrt,
  sub,
  add,
  divide,
} from './base';
import AnimatedBezier from './core/AnimatedBezier';

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
export default class Easing {
  /**
   * A linear function, `f(t) = t`. Position correlates to elapsed time one to
   * one.
   *
   * http://cubic-bezier.com/#0,0,1,1
   */
  static linear(t) {
    return t;
  }

  /**
   * A simple inertial interaction, similar to an object slowly accelerating to
   * speed.
   *
   * http://cubic-bezier.com/#.42,0,1,1
   */
  static ease(t) {
    return new AnimatedBezier(t, 0.42, 0, 1, 1);
  }

  /**
   * A quadratic function, `f(t) = t * t`. Position equals the square of elapsed
   * time.
   *
   * http://easings.net/#easeInQuad
   */
  static quad(t) {
    return multiply(t, t);
  }

  /**
   * A cubic function, `f(t) = t * t * t`. Position equals the cube of elapsed
   * time.
   *
   * http://easings.net/#easeInCubic
   */
  static cubic(t) {
    return multiply(t, t, t);
  }

  /**
   * A power function. Position is equal to the Nth power of elapsed time.
   *
   * n = 4: http://easings.net/#easeInQuart
   * n = 5: http://easings.net/#easeInQuint
   */
  static poly(n) {
    return (t) => pow(t, n);
  }

  /**
   * A sinusoidal function.
   *
   * http://easings.net/#easeInSine
   */
  static sin(t) {
    return sub(1, cos(multiply(t, Math.PI, 0.5)));
  }

  /**
   * A circular function.
   *
   * http://easings.net/#easeInCirc
   */
  static circle(t) {
    return sub(1, sqrt(sub(1, multiply(t, t))));
  }

  /**
   * An exponential function.
   *
   * http://easings.net/#easeInExpo
   */
  static exp(t) {
    return pow(2, multiply(10, sub(t, 1)));
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
  static elastic(bounciness = 1) {
    const p = bounciness * Math.PI;
    return (t) =>
      sub(
        1,
        multiply(pow(cos(multiply(t, Math.PI, 0.5)), 3), cos(multiply(t, p)))
      );
  }

  /**
   * Use with `Animated.parallel()` to create a simple effect where the object
   * animates back slightly as the animation starts.
   *
   * Wolfram Plot:
   *
   * - http://tiny.cc/back_default (s = 1.70158, default)
   */
  static back(s) {
    if (s === undefined) {
      s = 1.70158;
    }
    return (t) => multiply(t, t, sub(multiply(add(s, 1), t), s));
  }

  /**
   * Provides a simple bouncing effect.
   *
   * http://easings.net/#easeInBounce
   */
  static bounce(t) {
    const sq = (v) => multiply(7.5625, v, v);
    return cond(
      lessThan(t, 1 / 2.75),
      sq(t),
      cond(
        lessThan(t, 2 / 2.75),
        add(0.75, sq(sub(t, 1.5 / 2.75))),
        cond(
          lessThan(t, 2.5 / 2.76),
          add(0.9375, sq(sub(t, 2.25 / 2.75))),
          add(0.984375, sq(sub(t, 2.625 / 2.75)))
        )
      )
    );
  }

  /**
   * Provides a cubic bezier curve, equivalent to CSS Transitions'
   * `transition-timing-function`.
   *
   * A useful tool to visualize cubic bezier curves can be found at
   * http://cubic-bezier.com/
   */
  static bezier(x1, y1, x2, y2) {
    return (t) => new AnimatedBezier(t, x1, y1, x2, y2);
  }

  /**
   * Runs an easing function forwards.
   */
  static in(easing) {
    return easing;
  }

  /**
   * Runs an easing function backwards.
   */
  static out(easing) {
    return (t) => sub(1, easing(sub(1, t)));
  }

  /**
   * Makes any easing function symmetrical. The easing function will run
   * forwards for half of the duration, then backwards for the rest of the
   * duration.
   */
  static inOut(easing) {
    return (t) =>
      cond(
        lessThan(t, 0.5),
        divide(easing(multiply(t, 2)), 2),
        sub(1, divide(easing(multiply(sub(1, t), 2)), 2))
      );
  }
}
