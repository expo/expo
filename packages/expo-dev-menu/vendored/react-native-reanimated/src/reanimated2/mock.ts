/* eslint-disable standard/no-callback-literal */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const NOOP = () => {
  // noop
};
const ID = (t) => t;

const ReanimatedV2 = {
  useSharedValue: (v) => ({ value: v }),
  useDerivedValue: (a) => ({ value: a() }),
  useAnimatedScrollHandler: () => NOOP,
  useAnimatedGestureHandler: () => NOOP,
  useAnimatedStyle: (style) => style,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedReaction: NOOP,

  withTiming: (toValue, _, cb) => {
    cb && cb(true);
    return toValue;
  },
  withSpring: (toValue, _, cb) => {
    cb && cb(true);
    return toValue;
  },
  withDecay: (_, cb) => {
    cb && cb(true);
    return 0;
  },
  withDelay: (_, animationValue) => {
    return animationValue;
  },
  withSequence: (..._animations) => {
    return 0;
  },
  withRepeat: (animation) => {
    return animation;
  },
  cancelAnimation: NOOP,
  measure: () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pageX: 0,
    pageY: 0,
  }),
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    poly: ID,
    sin: ID,
    circle: ID,
    exp: ID,
    elastic: ID,
    back: ID,
    bounce: ID,
    bezier: ID,
    in: ID,
    out: ID,
    inOut: ID,
  },

  runOnJS: (fn) => fn,
};

module.exports = {
  ...ReanimatedV2,
};
